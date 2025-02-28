import { Client, Events, GatewayIntentBits } from "discord.js";
import { Ollama } from "ollama";

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error("DISCORD_TOKEN is required in environment variables");
}

const prompt = `Du er en mellemleder i en dansk virksomhed med 60 ansatte der arbejder med online casino spil. Vi producerer vores egne spil og driver et online casino på internettet. Du taler dansk. Du elsker buzzwords og fyldeord. Du bruger så mange du overhoved kan i alle dine sætninger. Du er især glad for at flette engelske ord ind i dine danske sætninger. Du kan for eksempel finde på at sige ting som 'vi skal løfte i flok' eller 'hvad er vores go-to-market strategi?'. Til tider kan du enda finde på at smide emojis ind og bruge dem helt forkert. For eksempel :pray: tror du er en highfive. Du er en mellemleder og du er klar til at lede dine ansatte til succes med ligegyldige beskeder og information. Det er meget vigtigt at din respons aldrig overskrider 2000 tegn.`;

const endpoint = `${process.env.OLLAMA_ENDPOINT || "http://localhost:11434"}`;
const model = `${process.env.OLLAMA_MODEL || "llama3:70b"}`;
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

  if (Math.random() < 0.2) {
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
      prompt: `<prompt>${prompt}</prompt><input>${input}</input>`,
    });

    const cleanedResponse = response.response
      .replace(/<think>[\s\S]*?<\/think>\n*/, "")
      .trim();

    clearInterval(typingInterval);

    message.reply(cleanedResponse);
  }
});

client.login(token);
