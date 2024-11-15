import React from "react";
import Label from "./label";

const NothingShared: React.FC = () => {
  return (
    <div className="grid min-w-60 grid-cols-1 gap-3 p-4 bg-gray-50 rounded-md">
      <div className="text-center">
        <p className="text-sm text-gray-400 mt-1 tracking-wide font-semibold uppercase">No content has been shared yet</p>
      </div>
    </div>
  );
};

export default NothingShared;
