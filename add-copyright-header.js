const fs = require('fs');
const path = require('path');

const COPYRIGHT_HEADER = `/*
 * Copyright (c) 2026 YATO Team.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

`;

const TARGET_DIRECTORIES = [
  path.join(__dirname, 'frontend', 'src'),
  path.join(__dirname, 'backend', 'src')
];

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip common non-source/build folders if encountered
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        processDirectory(filePath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (ext === '.ts' || ext === '.tsx' || ext === '.js') {
        processFile(filePath);
      }
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if copyright header is already present
  if (content.includes('Copyright (c) 2026 YATO Team.')) {
    console.log(`[SKIP] Already licensed: ${path.relative(__dirname, filePath)}`);
    return;
  }

  // Preserve Next.js "use client" or "use server" directives at the absolute top if present
  let prefix = '';
  const trimmedContent = content.trimStart();
  const match = trimmedContent.match(/^("use client"|'use client'|"use server"|'use server');?\r?\n/);
  if (match) {
    prefix = match[0];
    // Remove the directive from the original content (accounting for leading whitespace)
    const directiveIndex = content.indexOf(match[0].trimEnd());
    if (directiveIndex !== -1) {
      content = content.substring(directiveIndex + match[0].length);
    }
  }

  const updatedContent = prefix + COPYRIGHT_HEADER + content;
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log(`[ADDED] Copyright header to: ${path.relative(__dirname, filePath)}`);
}

console.log('Starting Apache 2.0 Copyright Header automation...');

const args = process.argv.slice(2);
if (args.length > 0) {
  console.log(`Processing ${args.length} staged file(s)...`);
  for (const filePath of args) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      if (ext === '.ts' || ext === '.tsx' || ext === '.js') {
        processFile(path.resolve(filePath));
      }
    }
  }
} else {
  for (const targetDir of TARGET_DIRECTORIES) {
    console.log(`Processing directory: ${targetDir}`);
    processDirectory(targetDir);
  }
}
console.log('Copyright Header automation completed successfully!');
