import { ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "@/lib/i18n";
import { Card, ScreenHeader } from "@/components/ui";

export default function PrivacyPolicyScreen() {
  const { dict } = useI18n();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-5 pb-8">
        <ScreenHeader title={dict.privacy.title} />
        <Card className="gap-4">
          <Text className="leading-relaxed text-text-secondary">{dict.privacy.body}</Text>
          <Text className="leading-relaxed text-text-secondary">{dict.privacy.dataCollected}</Text>
          <Text className="leading-relaxed text-text-secondary">{dict.privacy.noSelling}</Text>
          <Text className="leading-relaxed text-text-secondary">{dict.privacy.accountSecurity}</Text>
          <Text className="leading-relaxed text-text-secondary">{dict.privacy.medicalDisclaimer}</Text>
          <Text className="leading-relaxed text-text-secondary">{dict.privacy.notForChildren}</Text>
          <Text className="leading-relaxed text-text-secondary">{dict.privacy.deletion}</Text>
          <Text className="leading-relaxed text-text-secondary">{dict.privacy.operator}</Text>
          <Text className="leading-relaxed text-text-secondary">{dict.privacy.contact}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
