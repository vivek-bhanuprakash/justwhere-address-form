type UnshareBtnProps = {
  onClick: () => void;
};

const UnshareBtn: React.FC<UnshareBtnProps> = ({ onClick }: UnshareBtnProps) => {
  return (
    // <div className="inline-flex gap-1.5 rounded-md shadow-sm" role="group">
    //   <button
    //     type="button"
    //     className="inline-flex items-center rounded-sm bg-gray-700 px-2.5 py-2 text-sm font-normal text-gray-100 hover:bg-gray-900 hover:text-gray-100 focus:z-10 focus:bg-gray-900 focus:text-gray-100 focus:ring-2 focus:ring-gray-700"
    //     onClick={onClick}
    //   >
    //     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
    //       <path d="M12 6a2 2 0 1 0-1.994-1.842L5.323 6.5a2 2 0 1 0 0 3l4.683 2.342a2 2 0 1 0 .67-1.342L5.995 8.158a2.03 2.03 0 0 0 0-.316L10.677 5.5c.353.311.816.5 1.323.5Z" />
    //     </svg>
    //     <p className="mx-1 inline text-capitalize">Remove Share</p>
    //   </button>
    // </div>
    <div className="inline-flex rounded-md">
      <button
        type="button"
        className="inline-flex items-center rounded-sm bg-gray-700 px-2.5 py-2 text-red-400 hover:bg-red-900 hover:text-red-100 focus:z-10 focus:bg-red-900 focus:text-red-100 focus:ring-2 focus:ring-red-500"
        onClick={onClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
          <path
            fill-rule="evenodd"
            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm3 10.5a.75.75 0 0 0 0-1.5H9a.75.75 0 0 0 0 1.5h6Z"
            clip-rule="evenodd"
          />
        </svg>

        <p className="text-capitalize mx-1.5 inline text-sm font-normal uppercase text-gray-100">Remove Share</p>
      </button>
    </div>
  );
};
export default UnshareBtn;
