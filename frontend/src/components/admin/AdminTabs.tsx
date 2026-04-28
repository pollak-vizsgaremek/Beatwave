import { ADMIN_TABS, type AdminTabId } from "./types";

interface AdminTabsProps {
  activeTab: AdminTabId;
  onChange: (tab: AdminTabId) => void;
}

const AdminTabs = ({ activeTab, onChange }: AdminTabsProps) => {
  return (
    <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 justify-center">
      {ADMIN_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`cursor-pointer flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
            activeTab === tab.id
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default AdminTabs;
