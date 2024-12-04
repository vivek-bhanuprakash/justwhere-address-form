import React, { useEffect, useRef } from "react";
import { CurrentUserInfoRequest, GetCurrentUserInfo, IndividualID, JWError, UserID } from "../util";
import { OnErrorFcn } from "./types";

// Source: https://stackoverflow.com/questions/53446020/how-to-compare-oldvalues-and-newvalues-on-react-hooks-useeffect
const usePrevious = <T extends unknown>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export type OnLoginComplete = (userID: string, individualID: IndividualID) => void;

interface JWLoginProps {
  hostPort: string;
  onLoginComplete: OnLoginComplete;
  onError?: OnErrorFcn;
}

const JWLogin: React.FC<JWLoginProps> = ({ hostPort, onLoginComplete, onError }) => {
  const onLogin = async () => {
    window.open(`${hostPort}/api/login`, "_top");
  };

  const errorHandler = (e: JWError) => {
    if (onError !== null && onError !== undefined) {
      if (typeof onError === "function") {
        onError(e);
      } else {
        console.error("JustWhere: error handler must be a function. it is ", typeof onError);
      }
    } else {
      console.warn("JustWhere: no error handler provided");
    }
  };

  const loginHandler = (userID: UserID, individualID: IndividualID) => {
    if (onLoginComplete !== null && onLoginComplete !== undefined) {
      if (typeof onLoginComplete === "function") {
        onLoginComplete(userID, individualID);
      } else {
        console.error("JustWhere: login complete handler must be a function. it is ", typeof onLoginComplete);
        errorHandler(new JWError("login complete handler must be a function"));
      }
    } else {
      console.warn("JustWhere: no login complete handler provided");
    }
  };

  useEffect(() => {
    const fnEffect = async () => {
      try {
        const request: CurrentUserInfoRequest = { hostPort: hostPort, authToken: "" };
        const response = await GetCurrentUserInfo(request);
        loginHandler(response.userID, response.individualID);
      } catch (e) {
        errorHandler(e as JWError);
      }
    };

    fnEffect();
  }, [hostPort]);

  return (
    <>
      <div className="grid gap-3">
        <div>
          <div className="@container/address-header flex justify-start bg-gray-800 p-2">
            <img src={hostPort + "/justwhere.svg"} alt="JustWhere" className="@xs/address-header:h-10 @xs/address-header:w-10 h-8 w-8" />
            <div className="flex-col justify-around self-center">
              <p className="@xs/address-header:text-md ml-4 text-sm font-semibold uppercase text-gray-200">Sharing address safely</p>
            </div>
          </div>
        </div>
        <div className="bg-white-100 py-3">
          <p className="sm:text-md text-center text-sm font-light uppercase text-slate-800">
            Your provider has partnered with <span className="font-semibold uppercase">JustWhere</span> to securely access your address.
          </p>
          <div className="mt-3 text-center">
            <p className="sm:text-md inline text-sm font-normal uppercase text-slate-800">Click</p>
            <a
              href="#"
              referrerPolicy="origin"
              className="sm:text-md mx-1 text-sm font-semibold uppercase tracking-wide text-blue-600 underline"
              onClick={onLogin}
            >
              Here
            </a>
            <p className="sm:text-md inline text-sm font-normal uppercase text-slate-800">
              to Sign In to <span className="font-semibold uppercase">JustWhere</span>
            </p>
          </div>
        </div>
        <div className="grid gap-3">
          <div className="bg-gray-100 p-3 text-justify">
            <h1 className="sm:text-md text-sm font-normal uppercase tracking-wider text-gray-800">Share securely & easily</h1>
            <p className="md:text-md mt-3 text-sm font-light text-gray-700">
              <span className="font-semibold">JustWhere</span> is a privacy respecting service that empowers you to securely and easily share your addresses
              with family, friends and businesses within the <span className="font-semibold">JustWhere</span> community!
            </p>
          </div>
          <div className="bg-gray-100 p-3 text-justify">
            <h1 className="sm:text-md text-sm font-normal uppercase tracking-wider text-gray-800">You are in control</h1>
            <p className="sm:text-md mt-3 text-sm font-light text-gray-700">
              With <span className="font-semibold">JustWhere</span>, choose precisely who sees your address and for how long. When addresses change, everyone
              you have shared with gets the latest one automatically.
            </p>
          </div>
          <div className="bg-gray-100 p-3 text-justify">
            <h1 className="sm:text-md text-sm font-normal uppercase tracking-wider text-gray-800">Safe & private</h1>
            <p className="sm:text-md mt-3 text-sm font-light text-gray-700">
              Rest assured your addresses are stored securely with top notch encryption and visible to people you choose in the{" "}
              <span className="font-semibold">JustWhere</span> community.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default JWLogin;
