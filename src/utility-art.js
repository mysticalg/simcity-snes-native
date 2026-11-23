const textures={9:'water-pump',26:'water-tower',27:'heavy-pump',28:'solar',29:'municipal',30:'international',31:'military',32:'garden',33:'park',34:'city-park',35:'plaza'};
const educationTextures={43:'nursery-v1',44:'preschool-v2',45:'library-v1',46:'private-school-v1',47:'special-school-v1'};
export function utilityImagePath(sprite){if(educationTextures[sprite])return `assets/education/${educationTextures[sprite]}.webp`;return textures[sprite]?`assets/utility-expansion/${textures[sprite]}-v1.webp`:null;}
