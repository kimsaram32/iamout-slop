import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

function parseNickname(nickname) {
  if (!nickname) return null;
  const match = nickname.match(/^(\d{4})_(.+)$/);
  if (!match) return null;
  const studentNumber = Number(match[1]);
  const name = match[2];
  const grade = Math.floor(studentNumber / 1000);
  const room = Math.floor((studentNumber % 1000) / 100);
  return { studentNumber, name, grade, room };
}

const commands = [
  new SlashCommandBuilder()
    .setName('외출')
    .setDescription('외출을 등록합니다.')
    .addStringOption(opt =>
      opt.setName('사유').setDescription('외출 사유').setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('복귀')
    .setDescription('복귀를 등록합니다.'),
  new SlashCommandBuilder()
    .setName('초기화')
    .setDescription('반 전체 외출 목록을 초기화합니다.'),
].map(c => c.toJSON());

export async function registerCommands() {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  await rest.put(
    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
    { body: commands },
  );
  console.log('Discord slash commands registered globally.');
}

export function startBot() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const member = interaction.member;
    const nickname = member.nickname ?? member.nick ?? interaction.user.username;
    const parsed = parseNickname(nickname);

    if (!parsed) {
      await interaction.reply({ content: '닉네임 형식이 올바르지 않습니다. (예: 2501_김깔깔)', ephemeral: true });
      return;
    }

    const { studentNumber, name, grade, room } = parsed;

    try {
      if (interaction.commandName === '외출') {
        const reason = interaction.options.getString('사유') || '';
        await fetch(`${BASE_URL}/api/${grade}/${room}/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentNumber, name, reason }),
        });
        await interaction.reply({ content: `${name} 외출이 등록되었습니다.${reason ? ` (${reason})` : ''}`, ephemeral: true });

      } else if (interaction.commandName === '복귀') {
        await fetch(`${BASE_URL}/api/${grade}/${room}/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentNumber }),
        });
        await interaction.reply({ content: `${name} 복귀가 등록되었습니다.`, ephemeral: true });

      } else if (interaction.commandName === '초기화') {
        await fetch(`${BASE_URL}/api/${grade}/${room}/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        await interaction.reply({ content: `${grade}-${room}반 외출 목록이 초기화되었습니다.` });
      }
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: '오류가 발생했습니다.', ephemeral: true });
    }
  });

  client.once('ready', () => console.log(`Discord bot logged in as ${client.user.tag}`));
  client.login(process.env.DISCORD_TOKEN);
}
