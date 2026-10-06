import type { ManagedEvent } from "@/lib/events";

export type EventUpdateFields = {
  title: string;
  date: string;
  location: string;
  description: string | null;
};

export type EventUpdateError = {
  status: "error";
  message: string;
};

export type EventUpdateResult =
  | {
      status: "success";
      event: ManagedEvent;
    }
  | EventUpdateError;

export type EventUpdateState =
  | EventUpdateError
  | {
      status: "success";
      message: string;
      event: ManagedEvent;
    }
  | { status: "idle" };

export type EventUpdateDependencies = {
  isAuthorized: () => Promise<boolean>;
  findEventById: (
    id: string,
  ) => Promise<Pick<ManagedEvent, "id" | "date"> | null | undefined>;
  findOtherEventOnDate: (
    date: string,
    excludedId: string,
  ) => Promise<Pick<ManagedEvent, "id"> | null | undefined>;
  updateEvent: (id: string, fields: EventUpdateFields) => Promise<void>;
  getTodayInPrague?: () => string;
};

export function updateManagedEvent(
  formData: FormData,
  dependencies: EventUpdateDependencies,
): Promise<EventUpdateResult>;

export function getTodayInPrague(now?: Date): string;
