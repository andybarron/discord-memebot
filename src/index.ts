import {ImgflipClient} from "./ImgflipClient";
import {logger} from "./logger";
import {MemeManager} from "./MemeManager";
import {IMGFLIP_API_PASSWORD, IMGFLIP_API_USERNAME} from "./config";

async function main() {
  const manager = new MemeManager(
    new ImgflipClient(IMGFLIP_API_USERNAME, IMGFLIP_API_PASSWORD),
  );
  // TODO: Register slash commands
  // TODO: Respond to webhooks
}

main().catch((err) => logger.error({err}));
