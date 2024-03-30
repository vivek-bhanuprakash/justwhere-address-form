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

  const config: APIIndividualsConfig = new APIIndividualsConfig({
    basePath: `${hostPort}/api`,
    baseOptions: {
      withCredentials: true,
    },
  });

  const api = new APIIndividuals(config);

  const loginWatchDog = async () => {
    console.log("loginWatchDog #", watchDogRetries + 1);
    if (watchDogTimerID !== undefined && watchDogTimerID !== null) {
      clearTimeout(watchDogTimerID);
    }

    const response = await api.getCurrentUserInfo();
    const userInfo = response.data || null;
    if (userInfo !== null) {
      return onLoginComplete(userInfo.UserID || "", userInfo.IndividualID || "");
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
      clearTimeout(watchDogTimerID);
    }

    WATCHDOG_MAX_RETRIES = retries || LOGIN_MAX_RETRIES;
    WATCHDOG_INTERVAL = interval || LOGIN_CHECK_INTERVAL; // 2 seconds

    if (checkInProgress) {
      if (prevHostPort !== hostPort) {
        onLogin();
        return;
      } else {
        loginWatchDog();
      }
    }
  }, [hostPort, retries, interval]);

  return (
    <>
      <div className="m-5 grid gap-3">
        <div className="flex flex-row bg-gray-800 p-5">
          <img src={hostPort + "/justwhere.svg"} alt="JustWhere" className="h-8 w-8" />
          <p className="ml-4 text-lg font-semibold uppercase text-gray-200">Sharing address safely</p>
        </div>
        <div className="bg-slate-50 p-5">
          <p className="text-md text-center font-light uppercase text-slate-800">
            Your service provider has partnered with <b>JustWhere</b> to securely access your address.
          </p>
          <div className="mt-3 text-center">
            <p className="text-md inline font-semibold uppercase text-slate-800">Click</p>
            <button type="button" className="text-md font-semibold uppercase text-blue-600 underline" onClick={onLogin}>
              Login
            </button>
            <p className="text-md inline font-semibold uppercase text-slate-800">to continue</p>
          </div>
        </div>
        <div className="grid gap-2">
          <div className="bg-slate-50 p-5 text-justify">
            <h1 className="text-md font-light uppercase text-gray-800">Share securely and easily</h1>
            <p className="text-md mt-3 font-light text-gray-700">
              <b>JustWhere</b> is a privacy respecting service that empowers you to securely and easily share your addresses with family, friends and businesses
              within the <b>JustWhere</b> community!
            </p>
          </div>
          <div className="bg-slate-50 p-5 text-justify">
            <h1 className="text-md font-light uppercase text-gray-800">You are in control</h1>
            <p className="text-md mt-3 font-light text-gray-700">
              With <b>JustWhere</b>, choose precisely who sees your address and for how long. When addresses change, everyone you have shared with gets the
              latest one automatically.
            </p>
          </div>
          <div className="bg-slate-50 p-5 text-justify">
            <h1 className="text-md font-light uppercase text-gray-800">Safe & private</h1>
            <p className="text-md mt-3 font-light text-gray-700">
              Rest assured your addresses are stored securely with top notch encryption and visible only to people you choose in the <b>JustWhere</b> community.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default JWLogin;
