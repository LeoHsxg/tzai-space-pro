// 定義事件介面
export type Event = {
  id: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
  summary: string;
  colorId?: string;
  description: string;
  extendedProperties: {
    shared: {
      name: string;
      crowdSize: string;
      phone: string;
      email: string;
      eventDescription: string;
    };
  };
};
