import * as handlebars from "handlebars";

export const compileHandlebarsTemplate = <TData>(html: string, data: TData): string =>
  handlebars.compile<TData>(html)(data);
