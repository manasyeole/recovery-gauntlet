-- The Games Room stops being a quiz and becomes a card game.
--
-- The quiz tables are dropped rather than left behind. Nothing is lost that
-- was meant to last: a GameRoom had a six-hour TTL and was swept on sight, so
-- by the time this runs in any environment the rows are either already gone
-- or are an abandoned evening. The gauntlet's own tables (Session, Answer)
-- are untouched — different feature, different lifetime.

-- DropTable
DROP TABLE IF EXISTS "GameAnswer";

-- DropTable
DROP TABLE IF EXISTS "GamePlayer";

-- DropTable
DROP TABLE IF EXISTS "GameRoom";

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "gameSlug" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "affinity" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "stats" JSONB NOT NULL,
    "total" INTEGER NOT NULL,
    "abilityKind" TEXT NOT NULL,
    "abilityValue" INTEGER NOT NULL,
    "abilityName" TEXT NOT NULL,
    "abilityText" TEXT NOT NULL,
    "timesPlayed" INTEGER NOT NULL DEFAULT 0,
    "timesWon" INTEGER NOT NULL DEFAULT 0,
    "damageDealt" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Duel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "gameSlug" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'room',
    "difficulty" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'lobby',
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "maxRounds" INTEGER NOT NULL DEFAULT 12,
    "turnSeconds" INTEGER NOT NULL DEFAULT 25,
    "startHp" INTEGER NOT NULL DEFAULT 36,
    "eventIds" TEXT NOT NULL,
    "phaseEndsAt" TIMESTAMP(3),
    "winnerSeat" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Duel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Duelist" (
    "id" TEXT NOT NULL,
    "duelId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎮',
    "seat" INTEGER NOT NULL,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "hp" INTEGER NOT NULL,
    "deck" TEXT NOT NULL,
    "hand" TEXT NOT NULL,
    "discard" TEXT NOT NULL,
    "damageDealt" INTEGER NOT NULL DEFAULT 0,
    "roundsWon" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Duelist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuelTurn" (
    "id" TEXT NOT NULL,
    "duelId" TEXT NOT NULL,
    "duelistId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "seat" INTEGER NOT NULL,
    "cardId" TEXT NOT NULL,
    "stat" INTEGER NOT NULL,
    "dealt" INTEGER,
    "taken" INTEGER,
    "healed" INTEGER,
    "hpAfter" INTEGER,
    "timedOut" BOOLEAN NOT NULL DEFAULT false,
    "msTaken" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuelTurn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Card_gameSlug_cardId_key" ON "Card"("gameSlug", "cardId");

-- CreateIndex
CREATE INDEX "Card_gameSlug_rarity_idx" ON "Card"("gameSlug", "rarity");

-- CreateIndex
CREATE UNIQUE INDEX "Duel_code_key" ON "Duel"("code");

-- CreateIndex
CREATE INDEX "Duel_expiresAt_idx" ON "Duel"("expiresAt");

-- CreateIndex
CREATE INDEX "Duelist_duelId_idx" ON "Duelist"("duelId");

-- CreateIndex
CREATE UNIQUE INDEX "Duelist_duelId_token_key" ON "Duelist"("duelId", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Duelist_duelId_seat_key" ON "Duelist"("duelId", "seat");

-- CreateIndex
CREATE UNIQUE INDEX "Duelist_duelId_name_key" ON "Duelist"("duelId", "name");

-- CreateIndex
CREATE INDEX "DuelTurn_duelId_round_idx" ON "DuelTurn"("duelId", "round");

-- CreateIndex
CREATE UNIQUE INDEX "DuelTurn_duelistId_round_key" ON "DuelTurn"("duelistId", "round");

-- AddForeignKey
ALTER TABLE "Duelist" ADD CONSTRAINT "Duelist_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "Duel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelTurn" ADD CONSTRAINT "DuelTurn_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "Duel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuelTurn" ADD CONSTRAINT "DuelTurn_duelistId_fkey" FOREIGN KEY ("duelistId") REFERENCES "Duelist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
