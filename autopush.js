const watch = require('node-watch');
const path = require('path');
const almPath = path.dirname(require.resolve('salesforce-alm'));
const Project = require(path.join(almPath, 'lib', 'projectDir'));
const jsonfile = require('jsonfile');
const exec = require('child_process').exec;

console.log('\nAUTOPUSH', 'Starting\n');

const projectPath = Project.getPath();
const projectJsonPath = path.join(projectPath, 'sfdx-project.json');

let alreadyExecuting = false;

jsonfile.readFile(projectJsonPath, (err, projectJson) => {

  const packageDirectories = projectJson.packageDirectories;

  packageDirectories.forEach((paths) => {

    const packagePath = paths.path;
    const outputdir = path.join(projectPath, packagePath);

    const watcher = watch(outputdir, {
      recursive: true
    });

    watcher.on('change', (evt, name) => {
      // callback
      console.log('CHANGE DETECTED', evt, name.replace(projectPath, ''));

      if (!alreadyExecuting) {
        const script = 'export FORCE_SHOW_SPINNER=;sfdx force:source:push';
        alreadyExecuting = true;

        const child = exec(script);
        let outputData = '';

        child.stdout.on('data', (data) => {
          outputData += data;
        });
        
        child.stderr.on('data', (data) => {
          console.error(`child stderr:\n${data}`);
          alreadyExecuting = false;
        });

        child.on('close', () => {
          console.log(`\n${outputData}`);
          alreadyExecuting = false;
        });
      }
    });

    watcher.on('error', (waterErr) => {
      console.log('error', waterErr);
    });

    watcher.close();
    watcher.isClosed();
  });
});