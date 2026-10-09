import {
  cancelRequest,
  createCollaborationRequest,
  listReceivedRequests,
  listSentRequests,
  respondToRequest,
} from "../services/collaboration.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const create = asyncHandler(async (req, res) => {
  const request = await createCollaborationRequest({
    projectId: req.body.projectId,
    requesterId: req.user.userId,
    message: req.body.message,
  });

  res.status(201).json({
    success: true,
    message: "Collaboration request sent",
    data: { request },
  });
});

export const listReceived = asyncHandler(async (req, res) => {
  const result = await listReceivedRequests({
    ownerId: req.user.userId,
    ...req.validatedQuery,
  });

  res.status(200).json({ success: true, data: result });
});

export const listSent = asyncHandler(async (req, res) => {
  const result = await listSentRequests({
    requesterId: req.user.userId,
    ...req.validatedQuery,
  });

  res.status(200).json({ success: true, data: result });
});

const respondWith = (decision, message) =>
  asyncHandler(async (req, res) => {
    const request = await respondToRequest({
      requestId: req.params.requestId,
      ownerId: req.user.userId,
      decision,
    });

    res.status(200).json({ success: true, message, data: { request } });
  });

export const accept = respondWith("accepted", "Request accepted");
export const reject = respondWith("rejected", "Request rejected");

export const cancel = asyncHandler(async (req, res) => {
  const request = await cancelRequest({
    requestId: req.params.requestId,
    requesterId: req.user.userId,
  });

  res.status(200).json({
    success: true,
    message: "Request cancelled",
    data: { request },
  });
});
