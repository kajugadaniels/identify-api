// This DTO is intentionally empty — creating a liveness session
// only requires the authenticated user's identity which comes
// from the JWT, not from the request body.
// We keep the file to maintain consistent module structure
// and to make it easy to add optional config fields later
// (e.g. challenge type: FaceMovementChallenge vs FaceMovementAndLightChallenge)

export class CreateSessionDto {}
