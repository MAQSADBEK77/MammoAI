import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Article, ArticleCategory } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Card, LoadingSpinner, ScreenHeader } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

const CATEGORY_EMOJI: Record<ArticleCategory, string> = { cycle: "🩸", pregnancy: "🤰", checkups: "🩺" };
const CATEGORY_TINT: Record<ArticleCategory, string> = { cycle: "bg-primary/15", pregnancy: "bg-secondary/15", checkups: "bg-accent/15" };

export default function ArticlesScreen() {
  const { dict } = useI18n();
  const [articles, setArticles] = useState<Article[] | null>(null);

  useEffect(() => {
    api.articles.list().then(setArticles);
  }, []);

  if (!articles) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-3 pb-8">
        <ScreenHeader title={dict.articles.title} />
        <Text className="-mt-3 text-xs text-text-muted">{dict.articles.seedDataNotice}</Text>
        {articles.map((article) => (
          <Pressable key={article.id} className="active:scale-[0.98]" onPress={() => router.push(`/maqolalar/${article.slug}`)}>
            <Card className="flex-row items-start gap-3">
              <View className={`h-11 w-11 items-center justify-center rounded-2xl ${CATEGORY_TINT[article.category]}`}>
                <Emoji e={CATEGORY_EMOJI[article.category]} />
              </View>
              <View className="flex-1 gap-1.5">
                <Badge>{dict.articles.categories[article.category]}</Badge>
                <Text className="font-semibold text-text-primary">{article.title}</Text>
                <Text className="text-sm text-text-secondary" numberOfLines={2}>
                  {article.excerpt}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" style={{ marginTop: 4 }} />
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
