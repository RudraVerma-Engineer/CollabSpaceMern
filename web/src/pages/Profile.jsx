import { useState } from "react";

import ErrorMessage from "../components/common/ErrorMessage.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import ChangePasswordForm from "../components/people/ChangePasswordForm.jsx";
import ProfileForm from "../components/people/ProfileForm.jsx";
import ProfileHeader from "../components/people/ProfileHeader.jsx";
import UserProjects from "../components/people/UserProjects.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useFetch } from "../hooks/useFetch.js";
import { getUserProfile } from "../services/user.service.js";

/** My own profile: view + edit. */
const Profile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(!user.skills?.length && !user.bio); // new users start in edit mode

  const { data, loading, error } = useFetch(() => getUserProfile(user._id), [user._id]);

  return (
    <div className="stack">
      {editing ? (
        <ProfileForm onDone={() => setEditing(false)} />
      ) : (
        <ProfileHeader
          user={user}
          actions={<button type="button" className="btn" onClick={() => setEditing(true)}>Edit profile</button>}
        />
      )}

      <ErrorMessage message={error} />
      {loading && !data && <LoadingState />}
      {data && <UserProjects projects={data.projects} />}

      <h2 className="section-heading">Account</h2>
      <ChangePasswordForm />
    </div>
  );
};

export default Profile;
