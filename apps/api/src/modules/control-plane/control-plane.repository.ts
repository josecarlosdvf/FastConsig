import { pluginRegistry } from "@fastconsig/core";
import type { PageDefinition } from "@fastconsig/types";

export class ControlPlaneRepository {
  listPages(): PageDefinition[] {
    return pluginRegistry.listPages();
  }
}

