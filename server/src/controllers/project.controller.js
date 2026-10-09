import {
  createProject,
  deleteProject,
  getProjectDetails,
  listProjects,
  removeProjectMember,
  updateProject,
} from "../services/project.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const create = asyncHandler(async (req, res) => {
  const project = await createProject({
    ownerId: req.user.userId,
    data: req.body,
  });

  res.status(201).json({
    success: true,
    message: "Project created",
    data: { project },
  });
});

export const list = asyncHandler(async (req, res) => {
  const result = await listProjects(req.validatedQuery);

  res.status(200).json({ success: true, data: result });
});

/** Projects I own or have joined. */
export const listMine = asyncHandler(async (req, res) => {
  const result = await listProjects({
    ...req.validatedQuery,
    member: req.user.userId,
  });

  res.status(200).json({ success: true, data: result });
});

export const getOne = asyncHandler(async (req, res) => {
  const result = await getProjectDetails({
    projectId: req.params.projectId,
    viewerId: req.user.userId,
  });

  res.status(200).json({ success: true, data: result });
});

export const update = asyncHandler(async (req, res) => {
  const project = await updateProject({
    projectId: req.params.projectId,
    userId: req.user.userId,
    updates: req.body,
  });

  res.status(200).json({
    success: true,
    message: "Project updated",
    data: { project },
  });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteProject({
    projectId: req.params.projectId,
    userId: req.user.userId,
  });

  res.status(200).json({ success: true, message: "Project deleted" });
});

export const removeMember = asyncHandler(async (req, res) => {
  await removeProjectMember({
    projectId: req.params.projectId,
    actorId: req.user.userId,
    memberId: req.params.userId,
  });

  res.status(200).json({ success: true, message: "Member removed" });
});
