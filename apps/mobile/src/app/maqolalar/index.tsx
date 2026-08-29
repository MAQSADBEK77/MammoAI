import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { Article } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Card, ScreenHeader } from "@/components/ui";

export default function ArticlesScreen() {
  const { dict } = useI18n();
  const [articles, setArticles] = useState<Article[] | null>(null);

  useEffect(() => {
    api.articles.list().then(setArticles);
  }, []);

  if (!articles) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">{dict.common.loading}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-3 pb-8">
        <ScreenHeader title={dict.articles.title} />
        <Text className="-mt-3 text-xs text-text-muted">{dict.articles.seedDataNotice}</Text>
        {articles.map((article) => (
          <Pressable key={article.id} onPress={() => router.push(`/maqolalar/${article.slug}`)}>
            <Card className="gap-2">
              <Badge>{dict.articles.categories[article.category]}</Badge>
              <Text className="font-semibold text-text-primary">{article.title}</Text>
              <Text className="text-sm text-text-secondary">{article.excerpt}</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
