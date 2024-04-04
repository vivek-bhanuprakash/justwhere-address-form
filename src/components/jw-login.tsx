import React, { useEffect, useRef, useState } from "react";
import { Configuration as APIIndividualsConfig, DefaultApi as APIIndividuals } from "./../apis/individuals";
import { ID, OnErrorFcn } from "./jw-address";

// Source: https://stackoverflow.com/questions/53446020/how-to-compare-oldvalues-and-newvalues-on-react-hooks-useeffect
const usePrevious = <T extends unknown>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export const LOGIN_MAX_RETRIES = 29;
export const LOGIN_CHECK_INTERVAL = 2000;

export type OnLoginComplete = (userID: string, individualID: ID) => void;

interface JWLoginProps {
  hostPort: string;
  onLoginComplete: OnLoginComplete;
  onError?: OnErrorFcn;

  retries?: number;
  interval?: number;
}

const JWLogin: React.FC<JWLoginProps> = ({ hostPort, onLoginComplete, onError, retries, interval }) => {
  const prevHostPort = usePrevious(hostPort);

  let WATCHDOG_MAX_RETRIES = retries || LOGIN_MAX_RETRIES;
  let WATCHDOG_INTERVAL = interval || LOGIN_CHECK_INTERVAL; // 2 seconds

  let watchDogTimerID: number;
  let watchDogRetries: number = 0;

  const loginWatchDog = async () => {
    console.info("JWLogin: WatchDog retry #", watchDogRetries + 1);
    if (watchDogTimerID !== undefined && watchDogTimerID !== null) {
      clearTimeout(watchDogTimerID);
    }

    const config: APIIndividualsConfig = new APIIndividualsConfig({
      basePath: `${hostPort}/api`,
      baseOptions: {
        withCredentials: true,
      },
    });

    const api = new APIIndividuals(config);

    const response = await api.getCurrentUserInfo();
    const userInfo = response.data || null;
    if (userInfo !== null) {
      if (typeof userInfo.IndividualID === "string" && userInfo.IndividualID.length > 0) {
        return onLoginComplete(userInfo.UserID || "", userInfo.IndividualID || "");
      }
    }

    watchDogRetries++;
    if (watchDogRetries < WATCHDOG_MAX_RETRIES) {
      watchDogTimerID = window.setTimeout(async () => {
        await loginWatchDog();
      }, WATCHDOG_INTERVAL);
    } else {
      watchDogRetries = 0;
    }
  };

  const onLogin = async () => {
    if (watchDogTimerID !== undefined && watchDogTimerID !== null) {
      clearTimeout(watchDogTimerID);
    }

    window.open(`${hostPort}/api/login`, "_blank");
    watchDogRetries = 0;
    watchDogTimerID = window.setTimeout(loginWatchDog, WATCHDOG_INTERVAL);
  };

  useEffect(() => {
    let checkInProgress: boolean = false;
    if (watchDogTimerID !== undefined && watchDogTimerID !== null) {
      checkInProgress = true;
      console.info("JWLogin: Login was in progress.  It will be interrupted and retried.");
      clearTimeout(watchDogTimerID);
    }

    console.info("JWLogin: WatchDog retries:", WATCHDOG_MAX_RETRIES, ", interval:", WATCHDOG_INTERVAL);
    console.info("JWLogin: Host previous:", prevHostPort, ", current:", hostPort);

    if (checkInProgress) {
      if (prevHostPort !== hostPort) {
        onLogin();
        return;
      } else {
        loginWatchDog();
      }
    }
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
            <button type="button" className="sm:text-md mx-1 text-sm font-semibold uppercase tracking-wide text-blue-600 underline" onClick={onLogin}>
              Here
            </button>
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
