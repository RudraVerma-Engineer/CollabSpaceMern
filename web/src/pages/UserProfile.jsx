import { Navigate, useNavigate, useParams } from "react-router-dom";

import ErrorMessage from "../components/common/ErrorMessage.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import ProfileHeader from "../components/people/ProfileHeader.jsx";
import UserProjects from "../components/people/UserProjects.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useFetch } from "../hooks/useFetch.js";
import { useToast } from "../hooks/useToast.js";
import { createDirectConversation } from "../services/conversation.service.js";
import { getUserProfile } from "../services/user.service.js";
import { getErrorMessage } from "../utils/errors.js";

/** /people/:userId : another person's public profile. */
const UserProfile = () => {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const { data, loading, error } = useFetch(() => getUserProfile(userId), [userId]);

  if (userId === me._id) return <Navigate to="/profile" replace />;
  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorMessage message={error} />;

  const messageUser = async () => {
    try {
      const response = await createDirectConversation(userId);
      navigate(`/messages/${response.data.conversation._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="stack">
      <ProfileHeader
        user={data.user}
        actions={<button type="button" className="btn btn-primary" onClick={messageUser}>Message</button>}
      />
      <UserProjects projects={data.projects} />
    </div>
  );
};

export default UserProfile;
