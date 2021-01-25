import React from "react";

interface Props {
  header: string;
  columnOne: React.ReactNode;
  columnTwo: React.ReactNode;
}

export const TwoColumnContainer = ({ header, columnOne, columnTwo }: Props) => (
  <div className="mt-4">
    <h3 className="text-xl leading-6 font-medium text-gray-900 font-bold">
      {header}
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
      {columnOne}
      {columnTwo}
    </div>
  </div>
);
