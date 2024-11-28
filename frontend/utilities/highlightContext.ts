import { createContext } from "react";
import { Highlight } from "./backendService";

export const HighlightContext = createContext<{
  highlights: Highlight[];
  setHighlights: React.Dispatch<React.SetStateAction<Highlight[]>>;
}>({
  highlights: [],
  setHighlights: () => {},
});
