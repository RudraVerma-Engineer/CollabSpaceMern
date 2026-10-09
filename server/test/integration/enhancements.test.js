import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import {
  connectSocket,
  createApi,
  emitWithAck,
  startTestServer,
  uploadFile,
  waitForEvent,
} from "./helpers.js";

/** Phase 9/10 features: likes, comments, saved posts, uploads, GitHub stats. */
describe("CollabSpace enhancements", () => {
  let server;
  let api;
  const sockets = [];
  const ana = {};
  const ben = {};
  let postId;

  before(async () => {
    server = await startTestServer();
    api = createApi(server.baseUrl);

    for (const [person, name] of [[ana, "Ana"], [ben, "Ben"]]) {
      const res = await api("POST", "/auth/register", {
        body: { name, email: `${name.toLowerCase()}@test.dev`, password: "secret123" },
      });
      person.id = res.body.data.user._id;
      person.token = res.body.data.token;
    }

    const post = await api("POST", "/posts", {
      token: ana.token,
      body: { content: "Shipping my first release today" },
    });
    postId = post.body.data.post._id;
  });

  after(async () => {
    sockets.forEach((socket) => socket.disconnect());
    await server.stop();
  });

  describe("likes and saved posts", () => {
    it("toggles a like and reports counts without exposing the user list", async () => {
      const like = await api("POST", `/posts/${postId}/like`, { token: ben.token });
      assert.deepEqual(like.body.data, { liked: true, likesCount: 1 });

      const feed = await api("GET", "/posts", { token: ben.token });
      const post = feed.body.data.posts[0];
      assert.equal(post.likesCount, 1);
      assert.equal(post.likedByMe, true);
      assert.equal(post.likes, undefined);

      const asAna = await api("GET", `/posts/${postId}`, { token: ana.token });
      assert.equal(asAna.body.data.post.likedByMe, false);

      const unlike = await api("POST", `/posts/${postId}/like`, { token: ben.token });
      assert.deepEqual(unlike.body.data, { liked: false, likesCount: 0 });
    });

    it("saves and lists saved posts per user", async () => {
      const save = await api("POST", `/posts/${postId}/save`, { token: ben.token });
      assert.equal(save.body.data.saved, true);

      const saved = await api("GET", "/posts?saved=true", { token: ben.token });
      assert.equal(saved.body.data.posts.length, 1);
      assert.equal(saved.body.data.posts[0].savedByMe, true);

      const anaSaved = await api("GET", "/posts?saved=true", { token: ana.token });
      assert.equal(anaSaved.body.data.posts.length, 0);
    });

    it("returns 404 for a post that does not exist", async () => {
      const res = await api("POST", "/posts/aaaaaaaaaaaaaaaaaaaaaaaa/like", { token: ben.token });
      assert.equal(res.status, 404);
    });
  });

  describe("comments", () => {
    let commentId;

    it("adds a comment, bumps the count and notifies the post author live", async () => {
      const anaSocket = await connectSocket(server.baseUrl, ana.token);
      sockets.push(anaSocket);
      const pushed = waitForEvent(anaSocket, "notification:new");

      const res = await api("POST", `/posts/${postId}/comments`, {
        token: ben.token,
        body: { content: "Congrats!" },
      });
      assert.equal(res.status, 201);
      commentId = res.body.data.comment._id;

      assert.equal((await pushed).type, "post_comment");

      const post = await api("GET", `/posts/${postId}`, { token: ana.token });
      assert.equal(post.body.data.post.commentsCount, 1);

      const list = await api("GET", `/posts/${postId}/comments`, { token: ana.token });
      assert.equal(list.body.data.comments[0].author.name, "Ben");
    });

    it("rejects empty comments", async () => {
      const res = await api("POST", `/posts/${postId}/comments`, {
        token: ben.token,
        body: { content: "   " },
      });
      assert.equal(res.status, 400);
    });

    it("lets the post author (or comment author) delete, but not others", async () => {
      const stranger = await api("POST", "/auth/register", {
        body: { name: "Cy", email: "cy@test.dev", password: "secret123" },
      });
      const forbidden = await api("DELETE", `/posts/${postId}/comments/${commentId}`, {
        token: stranger.body.data.token,
      });
      assert.equal(forbidden.status, 403);

      const ok = await api("DELETE", `/posts/${postId}/comments/${commentId}`, { token: ana.token });
      assert.equal(ok.status, 200);

      const post = await api("GET", `/posts/${postId}`, { token: ana.token });
      assert.equal(post.body.data.post.commentsCount, 0);
    });
  });

  describe("uploads and attachments", () => {
    let uploaded;

    it("accepts an allowed file and returns its metadata", async () => {
      const res = await uploadFile(server.baseUrl, ana.token, {
        name: "notes.txt",
        type: "text/plain",
        content: "hello",
      });
      assert.equal(res.status, 201);
      uploaded = res.body.data.file;
      assert.match(uploaded.url, /^\/uploads\/[\w-]+\.txt$/);

      const download = await fetch(`${server.baseUrl}${uploaded.url}`);
      assert.equal(await download.text(), "hello");
    });

    it("rejects disallowed types, oversized files and anonymous uploads", async () => {
      const script = await uploadFile(server.baseUrl, ana.token, {
        name: "evil.html",
        type: "text/html",
        content: "<script>alert(1)</script>",
      });
      assert.equal(script.status, 400);

      const big = await uploadFile(server.baseUrl, ana.token, {
        name: "big.txt",
        type: "text/plain",
        content: "x".repeat(5 * 1024 * 1024 + 10),
      });
      assert.equal(big.status, 400);

      const anonymous = await uploadFile(server.baseUrl, "bad-token", {
        name: "a.txt",
        type: "text/plain",
        content: "a",
      });
      assert.equal(anonymous.status, 401);
    });

    it("sends a message with an attachment over the socket", async () => {
      const conv = await api("POST", "/conversations/direct", {
        token: ana.token,
        body: { participantId: ben.id },
      });
      const conversationId = conv.body.data.conversation._id;

      const benSocket = await connectSocket(server.baseUrl, ben.token);
      const anaSocket = await connectSocket(server.baseUrl, ana.token);
      sockets.push(benSocket, anaSocket);
      await emitWithAck(benSocket, "conversation:join", { conversationId });

      const received = waitForEvent(benSocket, "message:new");
      const ack = await emitWithAck(anaSocket, "message:send", {
        conversationId,
        content: "",
        attachments: [uploaded],
      });
      assert.equal(ack.success, true);

      const message = await received;
      assert.equal(message.type, "file");
      assert.equal(message.attachments[0].name, "notes.txt");

      const fake = await emitWithAck(anaSocket, "message:send", {
        conversationId,
        attachments: [{ url: "https://evil.example/x.exe", name: "x", mimeType: "text/plain" }],
      });
      assert.equal(fake.success, false);

      const empty = await emitWithAck(anaSocket, "message:send", { conversationId, content: "  " });
      assert.equal(empty.success, false);
    });

    it("supports editing and deleting your own message with live events", async () => {
      const conv = await api("POST", "/conversations/direct", {
        token: ana.token,
        body: { participantId: ben.id },
      });
      const conversationId = conv.body.data.conversation._id;

      const benSocket = await connectSocket(server.baseUrl, ben.token);
      sockets.push(benSocket);
      await emitWithAck(benSocket, "conversation:join", { conversationId });

      const sent = await api("POST", `/messages/${conversationId}`, {
        token: ana.token,
        body: { content: "typo" },
      });
      const messageId = sent.body.data.message._id;

      const edited = waitForEvent(benSocket, "message:edited");
      await api("PATCH", `/messages/message/${messageId}`, { token: ana.token, body: { content: "fixed" } });
      assert.equal((await edited).content, "fixed");

      const notOwner = await api("DELETE", `/messages/message/${messageId}`, { token: ben.token });
      assert.equal(notOwner.status, 404);

      const deleted = waitForEvent(benSocket, "message:deleted");
      await api("DELETE", `/messages/message/${messageId}`, { token: ana.token });
      assert.equal((await deleted).messageId, messageId);
    });
  });

  describe("GitHub repository stats", () => {
    const realFetch = globalThis.fetch;
    let githubCalls = 0;

    before(() => {
      // Only api.github.com is faked; calls to the test server go through.
      globalThis.fetch = (url, options) => {
        if (String(url).startsWith("https://api.github.com/repos/")) {
          githubCalls += 1;
          return Promise.resolve(
            String(url).endsWith("/missing")
              ? new Response("{}", { status: 404 })
              : Response.json({
                  full_name: "octo/demo",
                  description: "Demo",
                  stargazers_count: 42,
                  forks_count: 7,
                  open_issues_count: 3,
                  language: "JavaScript",
                  pushed_at: "2026-09-01T00:00:00Z",
                  html_url: "https://github.com/octo/demo",
                }),
          );
        }
        return realFetch(url, options);
      };
    });

    after(() => {
      globalThis.fetch = realFetch;
    });

    it("returns stars, forks and language, and caches the result", async () => {
      const url = encodeURIComponent("https://github.com/octo/demo");

      const first = await api("GET", `/github/repository?url=${url}`, { token: ana.token });
      assert.equal(first.status, 200);
      assert.equal(first.body.data.repository.stars, 42);
      assert.equal(first.body.data.repository.language, "JavaScript");

      await api("GET", `/github/repository?url=${url}`, { token: ana.token });
      assert.equal(githubCalls, 1);
    });

    it("handles unknown repositories and non-GitHub URLs", async () => {
      const missing = await api(
        "GET",
        `/github/repository?url=${encodeURIComponent("https://github.com/octo/missing")}`,
        { token: ana.token },
      );
      assert.equal(missing.status, 404);

      const invalid = await api(
        "GET",
        `/github/repository?url=${encodeURIComponent("https://example.com/a/b")}`,
        { token: ana.token },
      );
      assert.equal(invalid.status, 400);
    });
  });
});
