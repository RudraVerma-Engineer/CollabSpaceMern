import CollaborationRequest from "../models/collaborationRequest.model.js";
import Conversation from "../models/conversation.model.js";
import Post from "../models/post.model.js";
import Project from "../models/project.model.js";
import AppError from "../utils/AppError.js";
import { isSameId, assertValidObjectId } from "../utils/objectId.js";
import { buildPagination, getSkip } from "../utils/pagination.js";
import { containsRegex, normalizeList } from "../utils/text.js";
import {
  createProjectConversation,
  deleteProjectConversation,
  removeProjectConversationParticipant,
  renameProjectConversation,
} from "./conversation.service.js";

const USER_CARD_FIELDS = "name avatar college isOnline";

const populateProject = (query) =>
  query
    .populate("owner", USER_CARD_FIELDS)
    .populate("members", USER_CARD_FIELDS);

const normalizeProjectLists = (data) => {
  const result = { ...data };
  if (result.technologies) result.technologies = normalizeList(result.technologies);
  if (result.requiredSkills) result.requiredSkills = normalizeList(result.requiredSkills);
  return result;
};

/** Loads a project or throws 404. */
export const findProjectOrThrow = async (projectId) => {
  assertValidObjectId(projectId, "project ID");

  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  return project;
};

export const isProjectMember = (project, userId) =>
  project.members.some((member) => isSameId(member, userId));

const assertOwner = (project, userId) => {
  if (!isSameId(project.owner, userId)) {
    throw new AppError("Only the project owner can do this", 403);
  }
};

// ---------------------------------------------------------------------------

export const createProject = async ({ ownerId, data }) => {
  const project = await Project.create({
    ...normalizeProjectLists(data),
    owner: ownerId,
    members: [ownerId], // the owner is always a member
  });

  // Every project gets a team chat from day one.
  await createProjectConversation({ project });

  return populateProject(Project.findById(project._id));
};

export const listProjects = async ({
  q,
  technology,
  skill,
  status,
  lookingForCollaborators,
  owner,
  member,
  page = 1,
  limit = 12,
}) => {
  const filter = {};

  if (q) {
    const regex = containsRegex(q);
    filter.$or = [{ title: regex }, { description: regex }, { technologies: regex }];
  }
  if (technology) filter.technologies = technology.trim().toLowerCase();
  if (skill) filter.requiredSkills = skill.trim().toLowerCase();
  if (status) filter.status = status;
  if (lookingForCollaborators !== undefined) {
    filter.lookingForCollaborators = lookingForCollaborators;
  }
  if (owner) filter.owner = owner;
  if (member) filter.members = member;

  const [projects, total] = await Promise.all([
    populateProject(
      Project.find(filter)
        .sort({ createdAt: -1 })
        .skip(getSkip({ page, limit }))
        .limit(limit),
    ),
    Project.countDocuments(filter),
  ]);

  return { projects, pagination: buildPagination({ page, limit, total }) };
};

/** Owned and joined projects of one user (profile pages). */
export const getUserProjects = async (userId) => {
  const projects = await populateProject(
    Project.find({ members: userId }).sort({ createdAt: -1 }),
  );

  return {
    owned: projects.filter((project) => isSameId(project.owner, userId)),
    joined: projects.filter((project) => !isSameId(project.owner, userId)),
  };
};

/**
 * Project details plus what the *viewer* can do with it
 * (own it, belong to it, or has a pending request).
 */
export const getProjectDetails = async ({ projectId, viewerId }) => {
  assertValidObjectId(projectId, "project ID");

  const project = await populateProject(Project.findById(projectId));

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const isOwner = isSameId(project.owner, viewerId);
  const isMember = isProjectMember(project, viewerId);

  const [pendingRequest, conversation] = await Promise.all([
    isMember
      ? null
      : CollaborationRequest.findOne({
          project: project._id,
          requester: viewerId,
          status: "pending",
        }).select("_id"),
    isMember
      ? Conversation.findOne({ project: project._id }).select("_id")
      : null,
  ]);

  return {
    project,
    viewer: {
      isOwner,
      isMember,
      pendingRequestId: pendingRequest?._id ?? null,
      conversationId: conversation?._id ?? null,
    },
  };
};

export const updateProject = async ({ projectId, userId, updates }) => {
  const project = await findProjectOrThrow(projectId);
  assertOwner(project, userId);

  Object.assign(project, normalizeProjectLists(updates));
  await project.save();

  if (updates.title) {
    await renameProjectConversation({ projectId: project._id, name: project.title });
  }

  return populateProject(Project.findById(project._id));
};

export const deleteProject = async ({ projectId, userId }) => {
  const project = await findProjectOrThrow(projectId);
  assertOwner(project, userId);

  await Promise.all([
    CollaborationRequest.deleteMany({ project: project._id }),
    Post.updateMany({ project: project._id }, { $set: { project: null } }),
    deleteProjectConversation(project._id),
  ]);

  await project.deleteOne();
};

/**
 * - the owner can remove any other member
 * - a member can remove themselves (leave)
 * - the owner cannot leave; they must delete the project instead
 */
export const removeProjectMember = async ({ projectId, actorId, memberId }) => {
  const project = await findProjectOrThrow(projectId);

  if (isSameId(project.owner, memberId)) {
    throw new AppError("The owner cannot leave the project. Delete it instead.", 400);
  }

  const isSelfLeaving = isSameId(actorId, memberId);

  if (!isSelfLeaving) {
    assertOwner(project, actorId);
  }

  if (!isProjectMember(project, memberId)) {
    throw new AppError("User is not a member of this project", 404);
  }

  project.members = project.members.filter((member) => !isSameId(member, memberId));
  await project.save();

  await removeProjectConversationParticipant({
    projectId: project._id,
    userId: memberId,
  });
};
