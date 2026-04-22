interface AdminPaginationProps {
  activePage: number;
  totalPages: number;
  visiblePageNumbers: number[];
  onPageChange: (nextPage: number) => void;
}

const AdminPagination = ({
  activePage,
  totalPages,
  visiblePageNumbers,
  onPageChange,
}: AdminPaginationProps) => {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, activePage - 1))}
        disabled={activePage === 1}
        className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
      >
        Prev
      </button>

      {visiblePageNumbers.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded ${
            page === activePage
              ? "bg-blue-600 text-white"
              : "bg-gray-700 hover:bg-gray-600 text-gray-200"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, activePage + 1))}
        disabled={activePage === totalPages}
        className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

export default AdminPagination;
