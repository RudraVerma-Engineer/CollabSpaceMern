import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import {
  connectSocket,
  createApi,
  emitWithAck,
  startTestServer,
  waitForEvent,
} from "./helpers.js";

/**
 * The end-to-end scenario from the project specification (section 12):
 * Rudra publishes a project, Aman requests to collaborate, Rudra accepts,
 * and they chat in real time in the project conversation.
 */
describe("CollabSpace end-to-end flow", () => {
  let server;
  let api;
  const sockets = [];

  // Shared state filled in as the scenario progresses
  const rudra = {};
  const aman = {};
  const outsider = {};
  let project;
  let projectConversationId;
  let requestId;

  before(async () => {
    server = await startTestServer();
    api = createApi(server.baseUrl);
  });

  after(async () => {
    sockets.forEach((socket) => socket.disconnect());
    await server.stop();
  });

  // ---------------------------------------------------------------- auth ---
  describe("authentication", () => {
    it("registers users and never returns the password", async () => {
      for (const [person, name] of [
        [rudra, "Rudra"],
        [aman, "Aman"],
        [outsider, "Outsider"],
      ]) {
        const res = await api("POST", "/auth/register", {
          body: { name, email: `${name.toLowerCase()}@test.dev`, password: "secret123" },
        });
        assert.equal(res.status, 201);
        assert.ok(res.body.data.token);
        assert.equal(res.body.data.user.password, undefined);
        person.id = res.body.data.user._id;
        person.token = res.body.data.token;
      }
    });

    it("rejects duplicate emails, bad passwords and missing tokens", async () => {
      const duplicate = await api("POST", "/auth/register", {
        body: { name: "Rudra", email: "rudra@test.dev", password: "secret123" },
      });
      assert.equal(duplicate.status, 409);

      const badLogin = await api("POST", "/auth/login", {
        body: { email: "rudra@test.dev", password: "wrong-password" },
      });
      assert.equal(badLogin.status, 401);

      const noToken = await api("GET", "/users/me");
      assert.equal(noToken.status, 401);
    });

    it("returns the current user from GET /users/me", async () => {
      const res = await api("GET", "/users/me", { token: rudra.token });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.user.email, "rudra@test.dev");
    });
  });

  // ------------------------------------------------------------- profile ---
  describe("profiles & discovery", () => {
    it("updates the profile with normalised skills", async () => {
      const res = await api("PATCH", "/users/me", {
        token: rudra.token,
        body: {
          college: "IET Agra",
          skills: ["React", "#Node.js", "react"],
          githubProfile: "https://github.com/rudra",
        },
      });
      assert.equal(res.status, 200);
      assert.deepEqual(res.body.data.user.skills, ["react", "node.js"]);
    });

    it("rejects a non-GitHub profile URL", async () => {
      const res = await api("PATCH", "/users/me", {
        token: rudra.token,
        body: { githubProfile: "https://example.com/rudra" },
      });
      assert.equal(res.status, 400);
    });

    it("finds developers by skill and hides private fields", async () => {
      const res = await api("GET", "/users/search?skill=react", { token: aman.token });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.users.length, 1);
      assert.equal(res.body.data.users[0].name, "Rudra");
      assert.equal(res.body.data.users[0].email, undefined);
    });
  });

  // ------------------------------------------------------------- project ---
  describe("projects", () => {
    it("creates a project with the owner as member and a team chat", async () => {
      const res = await api("POST", "/projects", {
        token: rudra.token,
        body: {
          title: "Campus Connect",
          description: "A platform for students to find project teammates.",
          technologies: ["React", "Node.js"],
          requiredSkills: ["React"],
          status: "planning",
        },
      });
      assert.equal(res.status, 201);
      project = res.body.data.project;
      assert.equal(project.members.length, 1);
      assert.equal(project.members[0]._id, rudra.id);

      const details = await api("GET", `/projects/${project._id}`, { token: rudra.token });
      assert.equal(details.body.data.viewer.isOwner, true);
      assert.ok(details.body.data.viewer.conversationId);
      projectConversationId = details.body.data.viewer.conversationId;
    });

    it("filters projects by technology, status and availability", async () => {
      const hit = await api(
        "GET",
        "/projects?technology=react&status=planning&lookingForCollaborators=true",
        { token: aman.token },
      );
      assert.equal(hit.body.data.projects.length, 1);

      const miss = await api("GET", "/projects?status=completed", { token: aman.token });
      assert.equal(miss.body.data.projects.length, 0);
    });

    it("only lets the owner edit the project", async () => {
      const forbidden = await api("PATCH", `/projects/${project._id}`, {
        token: aman.token,
        body: { status: "completed" },
      });
      assert.equal(forbidden.status, 403);
    });
  });

  // --------------------------------------------------------------- posts ---
  describe("feed", () => {
    it("publishes a collaboration post linked to the project", async () => {
      const res = await api("POST", "/posts", {
        token: rudra.token,
        body: {
          type: "collaboration",
          content: "Looking for a React developer!",
          project: project._id,
          tags: ["#React", "teamup"],
        },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.data.post.project.title, "Campus Connect");
      assert.deepEqual(res.body.data.post.tags, ["react", "teamup"]);
    });

    it("blocks linking a project the author does not belong to", async () => {
      const res = await api("POST", "/posts", {
        token: aman.token,
        body: { content: "Not my project", project: project._id },
      });
      assert.equal(res.status, 403);
    });

    it("lists the feed with filters and lets only the author delete", async () => {
      const feed = await api("GET", "/posts?type=collaboration&tag=react", { token: aman.token });
      assert.equal(feed.body.data.posts.length, 1);

      const postId = feed.body.data.posts[0]._id;
      const forbidden = await api("DELETE", `/posts/${postId}`, { token: aman.token });
      assert.equal(forbidden.status, 403);
    });
  });

  // ------------------------------------------------------- collaboration ---
  describe("collaboration requests", () => {
    let rudraSocket;

    before(async () => {
      rudraSocket = await connectSocket(server.baseUrl, rudra.token);
      sockets.push(rudraSocket);
    });

    it("lets Aman request to join and notifies Rudra in real time", async () => {
      const notification = waitForEvent(rudraSocket, "notification:new");

      const res = await api("POST", "/collaboration-requests", {
        token: aman.token,
        body: { projectId: project._id, message: "I know React well." },
      });
      assert.equal(res.status, 201);
      requestId = res.body.data.request._id;

      const pushed = await notification;
      assert.equal(pushed.type, "collaboration_request");
      assert.equal(pushed.data.requestId, requestId);
    });

    it("prevents duplicates, self-requests and non-owner decisions", async () => {
      const duplicate = await api("POST", "/collaboration-requests", {
        token: aman.token,
        body: { projectId: project._id },
      });
      assert.equal(duplicate.status, 409);

      const selfRequest = await api("POST", "/collaboration-requests", {
        token: rudra.token,
        body: { projectId: project._id },
      });
      assert.equal(selfRequest.status, 400);

      const notOwner = await api("PATCH", `/collaboration-requests/${requestId}/accept`, {
        token: outsider.token,
      });
      assert.equal(notOwner.status, 404);
    });

    it("shows the request in the owner's inbox and the requester's sent list", async () => {
      const received = await api("GET", "/collaboration-requests/received?status=pending", {
        token: rudra.token,
      });
      assert.equal(received.body.data.requests.length, 1);

      const sent = await api("GET", "/collaboration-requests/sent", { token: aman.token });
      assert.equal(sent.body.data.requests.length, 1);
    });

    it("keeps Aman out of the team chat until he is accepted", async () => {
      const res = await api("GET", `/conversations/project/${project._id}`, { token: aman.token });
      assert.equal(res.status, 404);
    });

    it("accepts the request: Aman becomes a member and is notified", async () => {
      const amanSocket = await connectSocket(server.baseUrl, aman.token);
      sockets.push(amanSocket);
      const notification = waitForEvent(amanSocket, "notification:new");

      const res = await api("PATCH", `/collaboration-requests/${requestId}/accept`, {
        token: rudra.token,
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.request.status, "accepted");

      const pushed = await notification;
      assert.equal(pushed.type, "collaboration_accepted");
      assert.equal(pushed.data.conversationId, projectConversationId);

      const details = await api("GET", `/projects/${project._id}`, { token: aman.token });
      assert.equal(details.body.data.viewer.isMember, true);
      assert.equal(details.body.data.project.members.length, 2);

      // a decided request cannot be decided twice
      const again = await api("PATCH", `/collaboration-requests/${requestId}/reject`, {
        token: rudra.token,
      });
      assert.equal(again.status, 404);
    });
  });

  // ---------------------------------------------------------------- chat ---
  describe("real-time project chat", () => {
    let rudraSocket;
    let amanSocket;
    let outsiderSocket;

    before(async () => {
      [rudraSocket, amanSocket, outsiderSocket] = await Promise.all([
        connectSocket(server.baseUrl, rudra.token),
        connectSocket(server.baseUrl, aman.token),
        connectSocket(server.baseUrl, outsider.token),
      ]);
      sockets.push(rudraSocket, amanSocket, outsiderSocket);
    });

    it("rejects unauthenticated sockets", async () => {
      await assert.rejects(connectSocket(server.baseUrl, "not-a-token"));
    });

    it("only lets participants join the conversation room", async () => {
      const outsiderJoin = await emitWithAck(outsiderSocket, "conversation:join", {
        conversationId: projectConversationId,
      });
      assert.equal(outsiderJoin.success, false);

      const [a, b] = await Promise.all([
        emitWithAck(rudraSocket, "conversation:join", { conversationId: projectConversationId }),
        emitWithAck(amanSocket, "conversation:join", { conversationId: projectConversationId }),
      ]);
      assert.equal(a.success, true);
      assert.equal(b.success, true);
    });

    it("persists a message and delivers message:new to the room", async () => {
      const received = waitForEvent(rudraSocket, "message:new", (m) => m.type === "text");

      const ack = await emitWithAck(amanSocket, "message:send", {
        conversationId: projectConversationId,
        content: "Hi team, ready to build!",
      });
      assert.equal(ack.success, true);

      const message = await received;
      assert.equal(message.content, "Hi team, ready to build!");
      assert.equal(message.sender.name, "Aman");

      const history = await api("GET", `/messages/${projectConversationId}`, { token: rudra.token });
      const texts = history.body.data.messages.map((m) => m.content);
      assert.ok(texts.includes("Hi team, ready to build!"));
      assert.ok(texts.includes("Aman joined the project")); // system message
    });

    it("sends a new-message notification to the other member", async () => {
      const list = await api("GET", "/notifications?unread=true", { token: rudra.token });
      const chatNotification = list.body.data.notifications.find((n) => n.type === "new_message");
      assert.ok(chatNotification);
      assert.equal(chatNotification.data.conversationId, projectConversationId);

      const read = await api(
        "PATCH",
        `/notifications/conversation/${projectConversationId}/read`,
        { token: rudra.token },
      );
      assert.equal(read.status, 200);

      const count = await api("GET", "/notifications/unread-count", { token: rudra.token });
      const stillUnread = (await api("GET", "/notifications?unread=true", { token: rudra.token })).body.data.notifications;
      assert.ok(!stillUnread.some((n) => n.type === "new_message"));
      assert.equal(typeof count.body.data.count, "number");
    });

    it("relays typing state to the other participants only", async () => {
      const typing = waitForEvent(rudraSocket, "typing:start");
      amanSocket.emit("typing:start", { conversationId: projectConversationId });
      const payload = await typing;
      assert.equal(payload.userId, aman.id);
    });

    it("blocks REST access to the conversation for non-members", async () => {
      const read = await api("GET", `/messages/${projectConversationId}`, { token: outsider.token });
      assert.equal(read.status, 404);

      const write = await api("POST", `/messages/${projectConversationId}`, {
        token: outsider.token,
        body: { content: "let me in" },
      });
      assert.equal(write.status, 404);
    });

    it("delivers REST-sent messages in real time too", async () => {
      const received = waitForEvent(amanSocket, "message:new", (m) => m.content === "Sent via REST");
      const res = await api("POST", `/messages/${projectConversationId}`, {
        token: rudra.token,
        body: { content: "Sent via REST" },
      });
      assert.equal(res.status, 201);
      await received;
    });
  });

  // -------------------------------------------------------- direct chat ---
  describe("direct conversations", () => {
    it("re-uses the same one-to-one conversation", async () => {
      const first = await api("POST", "/conversations/direct", {
        token: aman.token,
        body: { participantId: outsider.id },
      });
      const second = await api("POST", "/conversations/direct", {
        token: outsider.token,
        body: { participantId: aman.id },
      });
      assert.equal(first.body.data.conversation._id, second.body.data.conversation._id);
    });
  });

  // ------------------------------------------------------------ discovery ---
  describe("search", () => {
    it("searches users, projects and posts at once", async () => {
      const res = await api("GET", "/search?q=react", { token: outsider.token });
      assert.equal(res.status, 200);
      assert.ok(res.body.data.users.length >= 1);
      assert.ok(res.body.data.posts.length >= 1);
      assert.ok(res.body.data.projects.length >= 1);
    });

    it("rejects too-short queries", async () => {
      const res = await api("GET", "/search?q=a", { token: outsider.token });
      assert.equal(res.status, 400);
    });
  });

  // ------------------------------------------------------ membership/ends ---
  describe("leaving and deleting", () => {
    it("lets a member leave, which removes them from the team chat", async () => {
      const res = await api("DELETE", `/projects/${project._id}/members/${aman.id}`, {
        token: aman.token,
      });
      assert.equal(res.status, 200);

      const chat = await api("GET", `/messages/${projectConversationId}`, { token: aman.token });
      assert.equal(chat.status, 404);
    });

    it("stops the owner from leaving and lets them delete the project", async () => {
      const leave = await api("DELETE", `/projects/${project._id}/members/${rudra.id}`, {
        token: rudra.token,
      });
      assert.equal(leave.status, 400);

      const del = await api("DELETE", `/projects/${project._id}`, { token: rudra.token });
      assert.equal(del.status, 200);

      const gone = await api("GET", `/projects/${project._id}`, { token: rudra.token });
      assert.equal(gone.status, 404);
    });
  });
});
