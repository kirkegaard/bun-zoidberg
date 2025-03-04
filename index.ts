import { Client, Events, GatewayIntentBits } from "discord.js";
import { Ollama } from "ollama";

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error("DISCORD_TOKEN is required in environment variables");
}

const endpoint = `${process.env.OLLAMA_ENDPOINT || "http://localhost:11434"}`;
const model = `${process.env.OLLAMA_MODEL || "llama3:70b"}`;
const prompts = process.env.PROMPTS?.split("|") || [];
if (prompts.length === 0) {
  throw new Error("DISCORD_PROMPTS is required in environment variables");
}

const getRandomPrompt = () =>
  prompts[Math.floor(Math.random() * prompts.length)];

const reactionPercentage = parseFloat(process.env.REACTION_PERCENTAGE || "0.1");
const reactions = ["👍", "🙏", "🤘"];

const ollama = new Ollama({ host: endpoint });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  if (Math.random() < reactionPercentage) {
    const react = async () => {
      await message.react(
        reactions[Math.floor(Math.random() * reactions.length)],
      );
    };
    setTimeout(react, 5000);
  }

  const content = message.content.trim();

  if (content.startsWith(`<@${client.user?.id}>`)) {
    console.log("Generating response to ", content);

    await message.channel.sendTyping();

    // Keep sending the typing indicator every 5 seconds until response is ready
    const typingInterval = setInterval(() => {
      message.channel.sendTyping();
    }, 5000);

    const input = content.replace(`<@${client.user?.id}>`, "").trim();

    const response = await ollama.generate({
      model,
      prompt: `<prompt>${getRandomPrompt()}</prompt><input>${input}</input>`,
    });

    const cleanedResponse = response.response
      .replace(/<think>[\s\S]*?<\/think>\n*/, "")
      .trim();

    clearInterval(typingInterval);

    message.reply(cleanedResponse);
  }
});

client.login(token);
