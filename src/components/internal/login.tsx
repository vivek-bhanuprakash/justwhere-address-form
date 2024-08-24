import React, { useEffect, useRef } from "react";
import { GetCurrentUserInfo, IndividualID, IsLoggedIn, JWErrorAuthenticationRequired } from "../../util";
import { OnErrorFcn } from "../types";

// Source: https://stackoverflow.com/questions/53446020/how-to-compare-oldvalues-and-newvalues-on-react-hooks-useeffect
const usePrevious = <T extends unknown>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export const WATCHDOG_MAX_RETRIES = 29;
export const WATCHDOG_INTERVAL = 2000;

export type OnLoginCompleteFcn = (userID: string, individualID: IndividualID) => void;
export type OnLoginRetriesExceededFcn = (interval: number, retries: number) => void;
interface LoginProps {
  hostPort: string;
  onComplete: OnLoginCompleteFcn;
  onRetriesExceeded?: OnLoginRetriesExceededFcn;
  onError?: OnErrorFcn;
}

const Login: React.FC<LoginProps> = ({ hostPort, onComplete, onRetriesExceeded, onError }) => {
  const prevHostPort = usePrevious(hostPort);

  let watchDogTimerID: number;
  let watchDogRetries: number = 0;

  const runWatchDog = async () => {
    if (watchDogTimerID !== undefined && watchDogTimerID !== null) {
      clearTimeout(watchDogTimerID);
    }

    try {
      const u = await GetCurrentUserInfo({ hostPort });
      if (typeof u.individualID === "string" && u.individualID.length > 0) {
        return onComplete(u.userID, u.individualID);
      }
    } catch (e: any) {
      if (!(e instanceof JWErrorAuthenticationRequired)) {
        watchDogRetries = 0;
        if (onError !== undefined) {
          return onError(e);
        } else {
          return;
        }
      }
    }

    watchDogRetries++;
    if (watchDogRetries < WATCHDOG_MAX_RETRIES) {
      watchDogTimerID = window.setTimeout(async () => {
        await runWatchDog();
      }, WATCHDOG_INTERVAL);
    } else {
      // retries exhausted
      watchDogRetries = 0;
      if (onRetriesExceeded !== undefined) {
        return onRetriesExceeded(WATCHDOG_INTERVAL, WATCHDOG_MAX_RETRIES);
      } else {
        return;
      }
    }
  };

  const onLogin = async () => {
    if (watchDogTimerID !== undefined && watchDogTimerID !== null) {
      clearTimeout(watchDogTimerID);
      watchDogRetries = 0;
    }

    if (!(await IsLoggedIn(hostPort))) {
      window.open(`${hostPort}/api/login`, "_blank");
      watchDogRetries = 0;
      watchDogTimerID = window.setTimeout(runWatchDog, WATCHDOG_INTERVAL);
    }
  };

  useEffect(() => {
    const fn = async () => {
      let checkInProgress: boolean = false;
      if (watchDogTimerID !== undefined && watchDogTimerID !== null) {
        checkInProgress = true;
        clearTimeout(watchDogTimerID);
      }

      if (checkInProgress) {
        if (prevHostPort !== hostPort) {
          await onLogin();
        } else {
          await runWatchDog();
        }
      }
    };

    if (hostPort !== undefined && hostPort.trim().length > 0) fn();
  }, [hostPort]);

  return (
    <>
      <div className="grid gap-3">
        <div className="@container/address-header flex justify-start bg-gray-800 p-2">
          <img src={hostPort + "/justwhere.svg"} alt="JustWhere" className="@xs/address-header:h-10 @xs/address-header:w-10 h-8 w-8" />
          <div className="flex-col justify-around self-center">
            <p className="@xs/address-header:text-md ml-4 text-sm font-semibold uppercase text-gray-200">Sharing address safely</p>
          </div>
        </div>
        <div className="bg-white-100 py-3">
          <p className="sm:text-md text-center text-sm font-light uppercase text-slate-800">
            This provider has partnered with <span className="font-semibold uppercase">JustWhere</span> to securely access the address.
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

export default Login;
