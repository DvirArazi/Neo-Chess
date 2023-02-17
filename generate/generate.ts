import fs from 'fs';

generateIconName();
generateIconLinks();

function generateIconName() {
  const filePaths = getAllFileNames('frontend/public/svgs/');
  const fileNames = filePaths.map(path => `${filePathToName(path)}`);

  fs.writeFileSync( `frontend/src/utils/types/iconName.ts`,
    `export type IconName = \n  ${fileNames.map(name=>`"${name}"`).join(' |\n  ')};\n`+
    `\n` +
    `export function iconNameToPath(name: IconName) {\n` +
    `  switch(name) {\n` +
    filePaths.map((path, i)=> `    case "${fileNames[i]}": return "${path}";\n`).join('') +
    `  }\n` +
    `}\n`
  );
}

function generateIconLinks() {
  const filePaths = getAllFileNames('frontend/public/svgs/');

  fs.writeFileSync(`frontend/src/components/IconLinks.tsx`, 
    `export default function IconLinks() {\n` +
    `  return [\n` +
    filePaths.map((path, i)=>`    <link key="${i}" rel="preload" as="image" href="/svgs/${path}.svg"/>,\n`).join('') +
    `  ]\n` +
    `}\n`
  );
}


function getAllFileNames(dir: string): string[] {
  let files = fs.readdirSync(dir);
  let filePaths: string[] = [];
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    if (file.endsWith(".svg")) {
      filePaths.push(file.slice(0, file.length - 4));
    } else if (fs.statSync(dir + '/' + file).isDirectory()) {
      filePaths = filePaths.concat(getAllFileNames(dir + '/' + file).map(fileName => file + '/' + fileName));
    }
  }
  return filePaths;
}

function filePathToName(filePath: string) {
  const parts = filePath.split(/[\/_]/);
  return parts[0] + parts.slice(1)
    .map(part=>part.charAt(0).toUpperCase() + part.slice(1)).join('');
}