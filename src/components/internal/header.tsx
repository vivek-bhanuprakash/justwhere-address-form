import { UserID } from "../../sdk";

export interface HeaderProps {
  hostPort: string;
  userID?: UserID;
}

const Header: React.FC<HeaderProps> = ({ hostPort, userID }) => {
  return (
    <>
      <div className="flex justify-start bg-gray-800 p-2 @container/address-header">
        {hostPort !== undefined && hostPort.trim().length > 0 ? (
          <img src={hostPort + "/justwhere.svg"} alt="JustWhere" className="h-8 w-8 @xs/address-header:h-10 @xs/address-header:w-10" />
        ) : (
          <p className="h-8 w-8 @xs/address-header:h-10 @xs/address-header:w-10">JW</p>
        )}
        <div className="flex-col justify-around self-center">
          <>
            <p className="@xs/address-header:text-md ml-4 text-sm font-semibold uppercase text-gray-200">Sharing address safely</p>
            {userID !== undefined ? <p className="@xs/address-header:text-sm ml-4 text-xs font-light text-gray-200">{userID}</p> : <></>}
          </>
        </div>
      </div>
    </>
  );
};

export default Header;
