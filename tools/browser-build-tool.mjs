import {BUILD_GROUPS} from '../src/build-palette.js';
export async function selectBuildTool(page,tool){const button=page.locator(`[data-tool="${tool}"]`);if(!await button.isVisible()){const group=BUILD_GROUPS.find(g=>g.tools.includes(tool));if(group)await page.locator(`[data-build-category="${group.id}"]`).click();}await button.click();}
