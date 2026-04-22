interface AdminPanelHeaderProps {
  canManageUsers: boolean;
  onCreateAnnouncement: () => void;
}

const AdminPanelHeader = ({
  canManageUsers,
  onCreateAnnouncement,
}: AdminPanelHeaderProps) => {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">
        Moderation Panel
      </h1>
      {canManageUsers ? (
        <button
          type="button"
          onClick={onCreateAnnouncement}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
        >
          Create announcement
        </button>
      ) : null}
    </div>
  );
};

export default AdminPanelHeader;
