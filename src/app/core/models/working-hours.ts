export class WorkingHours {
  constructor(
    public monday: DayHours | null,
    public tuesday: DayHours | null,
    public wednesday: DayHours | null,
    public thursday: DayHours | null,
    public friday: DayHours | null,
    public saturday: DayHours | null,
    public sunday: DayHours | null
  ) {}

  static fromApi(data: any): WorkingHours | null {
    if (!data) return null;
    return new WorkingHours(
      new DayHours(data.monday.open, data.monday.close),
      new DayHours(data.tuesday.open, data.tuesday.close),
      new DayHours(data.wednesday.open, data.wednesday.close),
      new DayHours(data.thursday.open, data.thursday.close),
      new DayHours(data.friday.open, data.friday.close),
      new DayHours(data.saturday.open, data.saturday.close),
      new DayHours(data.sunday.open, data.sunday.close),
    );
  }
}

export class DayHours {
  constructor(
    public open: string | null,
    public close: string | null
  ) {}
}


