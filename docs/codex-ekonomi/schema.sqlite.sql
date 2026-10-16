-- SQLite 3; maç cüzdanı kalıcı mağaza/banka hesabından ayrıdır. Para: tam TL.
PRAGMA foreign_keys = ON;
CREATE TABLE economy_configs (
 version TEXT PRIMARY KEY,
 config_json TEXT NOT NULL CHECK(json_valid(config_json)),
 sha256 TEXT NOT NULL CHECK(length(sha256)=64)
) STRICT;
CREATE TABLE catalog_items (
 config_version TEXT NOT NULL REFERENCES economy_configs(version),
 item_id TEXT NOT NULL,
 price INTEGER NOT NULL CHECK(price>=0),
 kill_reward INTEGER NOT NULL CHECK(kill_reward>=0),
 item_json TEXT NOT NULL CHECK(json_valid(item_json)),
 PRIMARY KEY(config_version,item_id)
) STRICT;
CREATE TABLE matches (
 match_id TEXT PRIMARY KEY,
 config_version TEXT NOT NULL REFERENCES economy_configs(version),
 phase TEXT NOT NULL CHECK(phase IN('warmup','freeze','live','postplant','ended')),
 half INTEGER NOT NULL CHECK(half>=1),
 map_id TEXT NOT NULL
) STRICT;
CREATE TABLE team_state (
 match_id TEXT NOT NULL REFERENCES matches(match_id),
 team TEXT NOT NULL CHECK(team IN('T','CT')),
 loss_streak INTEGER NOT NULL DEFAULT 0 CHECK(loss_streak BETWEEN 0 AND 5),
 PRIMARY KEY(match_id,team)
) STRICT;
CREATE TABLE wallets (
 match_id TEXT NOT NULL,
 player_id TEXT NOT NULL,
 team TEXT NOT NULL CHECK(team IN('T','CT')),
 money INTEGER NOT NULL DEFAULT 800 CHECK(money BETWEEN 0 AND 16000),
 armor INTEGER NOT NULL DEFAULT 0 CHECK(armor BETWEEN 0 AND 100),
 helmet INTEGER NOT NULL DEFAULT 0 CHECK(helmet IN(0,1)),
 defuse_kit INTEGER NOT NULL DEFAULT 0 CHECK(defuse_kit IN(0,1)),
 CHECK(team='CT' OR defuse_kit=0),
 PRIMARY KEY(match_id,player_id),
 FOREIGN KEY(match_id,team) REFERENCES team_state(match_id,team)
) STRICT;
CREATE TABLE rounds (
 match_id TEXT NOT NULL REFERENCES matches(match_id),
 round_id TEXT NOT NULL,
 round_index INTEGER NOT NULL CHECK(round_index>=1),
 winner TEXT CHECK(winner IN('T','CT')),
 reason TEXT CHECK(reason IN('ct_eliminated','t_eliminated','time_expired','bomb_detonated','bomb_defused')),
 bomb_planted INTEGER NOT NULL DEFAULT 0 CHECK(bomb_planted IN(0,1)),
 settled_at INTEGER,
 CHECK(coalesce((reason IS NULL AND winner IS NULL) OR
  (reason='ct_eliminated' AND winner='T') OR
  (reason IN('t_eliminated','time_expired') AND winner='CT' AND bomb_planted=0) OR
  (reason='bomb_detonated' AND winner='T' AND bomb_planted=1) OR
  (reason='bomb_defused' AND winner='CT' AND bomb_planted=1),0)),
 CHECK(settled_at IS NULL OR (winner IS NOT NULL AND reason IS NOT NULL)),
 PRIMARY KEY(match_id,round_id),
 UNIQUE(match_id,round_index)
) STRICT;
CREATE TABLE inventory_items (
 instance_id TEXT PRIMARY KEY,
 match_id TEXT NOT NULL REFERENCES matches(match_id),
 holder_player_id TEXT,
 config_version TEXT NOT NULL,
 item_id TEXT NOT NULL,
 slot TEXT NOT NULL CHECK(slot IN('primary','secondary','melee','defuse','grenade')),
 ammo_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(ammo_json)),
 FOREIGN KEY(match_id,holder_player_id) REFERENCES wallets(match_id,player_id),
 FOREIGN KEY(config_version,item_id) REFERENCES catalog_items(config_version,item_id)
) STRICT;
CREATE UNIQUE INDEX one_weapon_per_slot ON inventory_items(match_id,holder_player_id,slot)
 WHERE holder_player_id IS NOT NULL AND slot IN('primary','secondary','melee','defuse');
CREATE TABLE purchases (
 purchase_id TEXT PRIMARY KEY,
 match_id TEXT NOT NULL,
 round_id TEXT NOT NULL,
 player_id TEXT NOT NULL,
 request_id TEXT NOT NULL,
 config_version TEXT NOT NULL,
 item_id TEXT NOT NULL,
 charged_price INTEGER NOT NULL CHECK(charged_price>=0),
 result_json TEXT NOT NULL CHECK(json_valid(result_json)),
 FOREIGN KEY(match_id,round_id) REFERENCES rounds(match_id,round_id),
 FOREIGN KEY(match_id,player_id) REFERENCES wallets(match_id,player_id),
 FOREIGN KEY(config_version,item_id) REFERENCES catalog_items(config_version,item_id),
 UNIQUE(match_id,round_id,player_id,request_id)
) STRICT;
CREATE TABLE economy_ledger (
 event_id TEXT PRIMARY KEY,
 event_key TEXT NOT NULL,
 match_id TEXT NOT NULL,
 round_id TEXT NOT NULL,
 player_id TEXT NOT NULL,
 reason TEXT NOT NULL CHECK(reason IN('purchase','kill','round_settlement','half_reset')),
 requested_delta INTEGER NOT NULL,
 applied_delta INTEGER NOT NULL,
 balance_after INTEGER NOT NULL CHECK(balance_after BETWEEN 0 AND 16000),
 config_version TEXT NOT NULL REFERENCES economy_configs(version),
 created_at INTEGER NOT NULL,
 FOREIGN KEY(match_id,round_id) REFERENCES rounds(match_id,round_id),
 FOREIGN KEY(match_id,player_id) REFERENCES wallets(match_id,player_id),
 UNIQUE(match_id,round_id,player_id,event_key)
) STRICT;
-- Satın alma: BEGIN IMMEDIATE; faz/bölge/takım/envanter/para denetle;
-- aynı request_id varsa önceki sonucu dön; UPDATE wallets ... WHERE money>=fiyat;
-- envanter, purchases ve ledger satırlarını ekle; COMMIT. Hata: ROLLBACK.
-- Raunt ödemesi: BEGIN IMMEDIATE; settled_at NULL değilse eski sonucu dön;
-- tüm cüzdanlar + iki takım seri durumu + ledger + rounds.settled_at birlikte COMMIT.
-- Faz/zaman/bölge, 4 bomba/2 flaş ve item->slot/config_version eşleşmesi sunucuda
-- aynı transaction içinde doğrulanır. Şema tek başına satın alma servisi değildir.
