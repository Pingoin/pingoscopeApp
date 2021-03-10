import {
  EquatorialCoordinates,
  HorizontalCoordinates
} from "astronomical-algorithms/dist/coordinates";
import aa from "../backend/astronomical-algorithms";
import { degreesToString, hoursToString } from "./helper";

const latitude = 53 + 44 / 60 + 16.44 / 3600;
const longitude = 14 + 2 / 60 + 40.92 / 3600;

export default class Globals {
  private static instance: Globals;

  public static getInstance(): Globals {
    if (this.instance == undefined) {
      this.instance = new Globals();
    }
    return this.instance;
  }
  private sensorPosition: HorizontalCoordinates = {
    altitude: 0,
    azimuth: 0
  };
  private targetPosition: EquatorialCoordinates = {
    declination: 0,
    rightAscension: 0
  };
  private actualPosition: HorizontalCoordinates = {
    altitude: 0,
    azimuth: 0
  };

  public get actualPositionHorizontal(): HorizontalCoordinates {
    return this.actualPosition;
  }

  public get actualPositionHorizontalString(): {
    altitude: string;
    azimuth: string;
  } {
    return {
      altitude: degreesToString(this.actualPosition.altitude),
      azimuth: degreesToString(this.actualPosition.azimuth)
    };
  }

  public get sensorPositionHorizontalString(): {
    altitude: string;
    azimuth: string;
  } {
    return {
      altitude: degreesToString(this.sensorPosition.altitude),
      azimuth: degreesToString(this.sensorPosition.azimuth)
    };
  }
  public set actualPositionHorizontal(value: HorizontalCoordinates) {
    this.actualPosition = value;
  }

  public get actualPositionEquatorial(): EquatorialCoordinates {
    const jd = aa.julianday.getJulianDay(new Date()) || 0;
    const eq = aa.coordinates.transformHorizontalToEquatorial(
      jd,
      this.actualPosition.altitude,
      this.actualPosition.azimuth,
      longitude,
      latitude
    );
    eq.rightAscension -= 0.5 / 3600;
    eq.rightAscension = Math.max(eq.rightAscension, 0);
    return eq;
  }

  public get sensorPositionHorizontal(): HorizontalCoordinates {
    return this.sensorPosition;
  }
  public set sensorPositionHorizontal(value: HorizontalCoordinates) {
    this.sensorPosition = value;
  }

  public get targetPositionHorizontal(): HorizontalCoordinates {
    const jd = aa.julianday.getJulianDay(new Date()) || 0;
    return aa.coordinates.transformEquatorialToHorizontal(
      jd,
      longitude,
      latitude,
      this.targetPosition.rightAscension,
      this.targetPosition.declination
    );
  }

  public get targetPositionEquatorial(): EquatorialCoordinates {
    return this.targetPosition;
  }
  public get targetPositionEquatorialString(): {
    declination: string;
    rightAscension: string;
  } {
    return {
      declination: degreesToString(this.targetPosition.declination),
      rightAscension: hoursToString(this.targetPosition.rightAscension)
    };
  }
  public set targetPositionEquatorial(value: EquatorialCoordinates) {
    this.targetPosition = value;
  }
}
