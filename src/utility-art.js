const textures={9:'water-pump',26:'water-tower',27:'heavy-pump',28:'solar',32:'garden',33:'park',34:'city-park',35:'plaza'};
export function utilityImagePath(sprite){return textures[sprite]?`assets/utility-expansion/${textures[sprite]}-v1.webp`:null;}
