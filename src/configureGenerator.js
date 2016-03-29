import fs from 'fs';
import getSvsgInDir from './helpers/getSvgsInDir';
import minifySvg from './helpers/minifySvg';
import nunjucks from 'nunjucks';
import path from 'path';
import {cleanupName, cleanupSvg} from './helpers/cleanup';

nunjucks.configure({ autoescape: false });

const defaultTemplate = path.join(__dirname, '..', 'template', 'icon.nunjucks');
const defaultComment = 'Generated by gulp svg-icon - do not modify manually';

export default function configureGenerator(config) {
  return () => {
    const template = config.template || defaultTemplate;
    const templateFile = path.isAbsolute(template)
      ? template
      : path.join(process.cwd(), template);
    const templateContent = fs.readFileSync(templateFile).toString();

    const svgDir = path.isAbsolute(config.svgDir)
      ? config.svgDir
      : path.join(process.cwd(), config.svgDir);

    console.log('Looking for SVG Icons in:', svgDir); // eslint-disable-line no-console

    console.log('Using Icon template from:', templateFile); // eslint-disable-line no-console

    const svgs = getSvsgInDir(svgDir);

    const iconDestination = config.destination || path.join(process.cwd(), 'Icon.react.js');

    const comment = config.comment || defaultComment;
    const reactPureRender = config.reactPureRender;

    const svgPromises = svgs.map(file => minifySvg(file, fs.readFileSync(file).toString()));
    Promise.all(svgPromises).then(results => {
      const icons = results.map(result => {
        return {
          name: cleanupName(result.name),
          svg: cleanupSvg(result.svg.data)
        };
      }).sort((a, b) => a.name.localeCompare(b.name));

      fs.writeFileSync(
        iconDestination,
        nunjucks.renderString(templateContent, {icons, comment, reactPureRender, radium: config.radium})
      );

      console.log('Generated SVG Icon component to:', iconDestination); // eslint-disable-line no-console
      console.log(icons.map(icon => `<Icon kind="${icon.name}" />`).join('\n')); // eslint-disable-line no-console
    });
  };
}
