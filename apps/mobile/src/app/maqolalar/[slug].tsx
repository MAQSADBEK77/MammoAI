import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import type { Article } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Card, LoadingSpinner } from "@/components/ui";

export default function ArticleDetailScreen() {
  const { dict } = useI18n();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    if (slug) api.articles.get(slug).then(setArticle);
  }, [slug]);

  if (!article) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <LoadingSpinner label={dict.common.loading} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-3 pb-8">
        <Badge>{dict.articles.categories[article.category]}</Badge>
        <Text className="text-2xl font-bold text-text-primary">{article.title}</Text>
        <Card>
          <Text className="leading-relaxed text-text-secondary">{article.body}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
