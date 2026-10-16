using System;

namespace Npng.Design
{
    // Veri aktarım örneğidir; oyun koduna bağlanmamıştır.
    // Alanları yalnız yetkili sunucu günceller; istemci kayıt isteği kabul edilmez.
    public sealed class CompetitiveProfileV1
    {
        public string Player_Id { get; set; } = "";
        public long Account_XP { get; set; }
        public int Account_Level { get; set; } = 1;
        public long Account_TL { get; set; }

        public int Competitive_Elo { get; set; } = 900;
        public string Rank_Tier { get; set; } = null;
        public int? Rank_Division { get; set; } = null;
        public string Rank_Label { get; set; } = "Derecelendirilmemiş";
        public int Placement_Matches_Completed { get; set; }
        public int Placement_Matches_Left
        {
            get { return Math.Max(0, 5 - Placement_Matches_Completed); }
        }

        public long Ranked_Wins { get; set; }
        public long Ranked_Losses { get; set; }
        public long Ranked_Draws { get; set; }
        public long Ranked_Abandons { get; set; }
        public string Competitive_Season { get; set; } = "S1";
        public long Season_Ranked_Wins { get; set; }
        public long Season_Ranked_Losses { get; set; }
        public long Season_Ranked_Draws { get; set; }
        public string Last_Competitive_Match_Id { get; set; } = null;
        public DateTimeOffset? Competitive_Rating_Updated_At { get; set; } = null;
        public PreviousCompetitiveSeasonV1 Previous_Season { get; set; } = null;
        public double? Unranked_Hidden_MMR { get; set; } = null;
    }

    public sealed class PreviousCompetitiveSeasonV1
    {
        public string Season { get; set; } = "";
        public int Elo { get; set; }
        public string Rank { get; set; } = "";
    }
}
