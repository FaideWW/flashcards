// How many hours to wait before surfacing the entry again in reviews.
// Timings taken from Wanikani (https://community.wanikani.com/t/srs-time-intervals-v670/18097/2)
export const SRS_INTERVALS = [0, 4, 8, 23, 47, 167, 335, 719, 2879];

export function hoursInMs(hrs: number): number {
  return hrs * 60 * 60 * 1000;
}

export function hoursFromNow(hrs: number): Date {
  return new Date(new Date().getTime() + hoursInMs(hrs));
}
