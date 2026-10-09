import CollaborationRequest from "../models/collaborationRequest.model.js";
import Project from "../models/project.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import { assertValidObjectId, isSameId } from "../utils/objectId.js";
import { buildPagination, getSkip } from "../utils/pagination.js";
import { addProjectConversationParticipant } from "./conversation.service.js";
import { createMessage } from "./message.service.js";
import { createNotification } from "./notification.service.js";
import { findProjectOrThrow, isProjectMember } from "./project.service.js";

const populateRequest = (query) =>
  query
    .populate("project", "title status")
    .populate("requester", "name avatar college skills")
    .populate("owner", "name avatar");

// ---------------------------------------------------------------------------
// Send a request
// ---------------------------------------------------------------------------

export const createCollaborationRequest = async ({
  projectId,
  requesterId,
  message = "",
}) => {
  const project = await findProjectOrThrow(projectId);

  if (isSameId(project.owner, requesterId)) {
    throw new AppError("You cannot request to join your own project", 400);
  }

  if (isProjectMember(project, requesterId)) {
    throw new AppError("You are already a member of this project", 409);
  }

  if (!project.lookingForCollaborators) {
    throw new AppError("This project is not accepting collaborators", 400);
  }

  const existingRequest = await CollaborationRequest.findOne({
    project: project._id,
    requester: requesterId,
    status: "pending",
  });

  if (existingRequest) {
    throw new AppError("You already have a pending request for this project", 409);
  }

  const request = await CollaborationRequest.create({
    project: project._id,
    requester: requesterId,
    owner: project.owner,
    message,
  });

  const requester = await User.findById(requesterId).select("name");

  await createNotification({
    recipient: project.owner,
    type: "collaboration_request",
    title: `${requester.name} wants to join ${project.title}`,
    message,
    data: {
      requestId: request._id.toString(),
      projectId: project._id.toString(),
    },
  });

  return populateRequest(CollaborationRequest.findById(request._id));
};

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

const listRequests = async ({ filter, page = 1, limit = 12 }) => {
  const [requests, total] = await Promise.all([
    populateRequest(
      CollaborationRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(getSkip({ page, limit }))
        .limit(limit),
    ),
    CollaborationRequest.countDocuments(filter),
  ]);

  return { requests, pagination: buildPagination({ page, limit, total }) };
};

/** Requests for projects I own (my inbox). */
export const listReceivedRequests = ({ ownerId, status, page, limit }) =>
  listRequests({ filter: { owner: ownerId, ...(status && { status }) }, page, limit });

/** Requests I sent to other people's projects. */
export const listSentRequests = ({ requesterId, status, page, limit }) =>
  listRequests({
    filter: { requester: requesterId, ...(status && { status }) },
    page,
    limit,
  });

// ---------------------------------------------------------------------------
// Accept / reject / cancel
// ---------------------------------------------------------------------------

/**
 * Atomically moves a *pending* request to a new status.
 * The `status: "pending"` condition makes double-clicks and races harmless.
 */
const transitionPendingRequest = async ({ requestId, filter, status }) => {
  assertValidObjectId(requestId, "request ID");

  const request = await CollaborationRequest.findOneAndUpdate(
    { _id: requestId, status: "pending", ...filter },
    { $set: { status } },
    { returnDocument: "after" },
  );

  if (!request) {
    throw new AppError("Pending request not found", 404);
  }

  return request;
};

export const respondToRequest = async ({ requestId, ownerId, decision }) => {
  const request = await transitionPendingRequest({
    requestId,
    filter: { owner: ownerId },
    status: decision,
  });

  const project = await Project.findById(request.project);

  if (decision === "rejected") {
    await createNotification({
      recipient: request.requester,
      type: "collaboration_rejected",
      title: `Your request to join ${project.title} was declined`,
      data: { projectId: project._id.toString() },
    });

    return populateRequest(CollaborationRequest.findById(request._id));
  }

  // ----- accepted: add to project + team chat -----
  await Project.updateOne(
    { _id: project._id },
    { $addToSet: { members: request.requester } },
  );

  const conversation = await addProjectConversationParticipant({
    projectId: project._id,
    userId: request.requester,
  });

  const requester = await User.findById(request.requester).select("name");

  await createNotification({
    recipient: request.requester,
    type: "collaboration_accepted",
    title: `You joined ${project.title}`,
    message: "Your collaboration request was accepted. Say hello to the team!",
    data: {
      projectId: project._id.toString(),
      conversationId: conversation?._id.toString(),
    },
  });

  // Tell the rest of the team (not the owner who clicked, not the new member).
  const teammates = project.members.filter(
    (member) =>
      !isSameId(member, project.owner) && !isSameId(member, request.requester),
  );

  await Promise.all(
    teammates.map((member) =>
      createNotification({
        recipient: member,
        type: "project_member_added",
        title: `${requester.name} joined ${project.title}`,
        data: {
          projectId: project._id.toString(),
          conversationId: conversation?._id.toString(),
        },
      }),
    ),
  );

  if (conversation) {
    await createMessage({
      conversationId: conversation._id,
      userId: request.requester,
      content: `${requester.name} joined the project`,
      type: "system",
    });
  }

  return populateRequest(CollaborationRequest.findById(request._id));
};

export const cancelRequest = async ({ requestId, requesterId }) => {
  const request = await transitionPendingRequest({
    requestId,
    filter: { requester: requesterId },
    status: "cancelled",
  });

  return populateRequest(CollaborationRequest.findById(request._id));
};
