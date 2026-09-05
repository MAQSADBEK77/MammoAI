// AVTOMATIK GENERATSIYA QILINGAN — qo'lda tahrirlamang.
// packages/shared/src/illustration-library.ts dagi ILLUSTRATION_LIBRARY bilan mos.
// react-native-svg-transformer statik import talab qiladi, shuning uchun HAR BIR
// kutubxona SVG fayli bu yerda alohida import qilinadi va slug -> Component xaritasiga yig'iladi.
import type { FunctionComponent } from "react";
import type { SvgProps } from "react-native-svg";

import I_classic_welcome from "../../assets/illustrations/welcome.svg";
import I_classic_secure_login from "../../assets/illustrations/secure-login.svg";
import I_classic_goal from "../../assets/illustrations/goal.svg";
import I_classic_calendar from "../../assets/illustrations/calendar.svg";
import I_classic_medicine from "../../assets/illustrations/medicine.svg";
import I_classic_doctor from "../../assets/illustrations/doctor.svg";
import I_classic_notifications from "../../assets/illustrations/notifications.svg";
import I_classic_meditation from "../../assets/illustrations/meditation.svg";
import I_classic_well_done from "../../assets/illustrations/well-done.svg";
import I_classic_healthy_lifestyle from "../../assets/illustrations/healthy-lifestyle.svg";
import I_classic_expecting from "../../assets/illustrations/expecting.svg";
import I_action_required_pplo from "../../assets/illustrations/library/action-required_pplo.svg";
import I_alarm_ringing_4deu from "../../assets/illustrations/library/alarm-ringing_4deu.svg";
import I_all_checked_d3u6 from "../../assets/illustrations/library/all-checked_d3u6.svg";
import I_authentication_1evl from "../../assets/illustrations/library/authentication_1evl.svg";
import I_biometric_login_v832 from "../../assets/illustrations/library/biometric-login_v832.svg";
import I_calendar_8r6s from "../../assets/illustrations/library/calendar_8r6s.svg";
import I_completing_3pe7 from "../../assets/illustrations/library/completing_3pe7.svg";
import I_date_picker_8qys from "../../assets/illustrations/library/date-picker_8qys.svg";
import I_digital_calendar_180l from "../../assets/illustrations/library/digital-calendar_180l.svg";
import I_events_calendar_sudy from "../../assets/illustrations/library/events-calendar_sudy.svg";
import I_followers_m4z4 from "../../assets/illustrations/library/followers_m4z4.svg";
import I_forgot_password_nttj from "../../assets/illustrations/library/forgot-password_nttj.svg";
import I_friends_online_gvwz from "../../assets/illustrations/library/friends-online_gvwz.svg";
import I_guidelines_p5r7 from "../../assets/illustrations/library/guidelines_p5r7.svg";
import I_happy_news_6lg3 from "../../assets/illustrations/library/happy-news_6lg3.svg";
import I_hello_ccwj from "../../assets/illustrations/library/hello_ccwj.svg";
import I_hiking_9zta from "../../assets/illustrations/library/hiking_9zta.svg";
import I_lock_screen_notifications_n6o8 from "../../assets/illustrations/library/lock-screen-notifications_n6o8.svg";
import I_meditation_k4oa from "../../assets/illustrations/library/meditation_k4oa.svg";
import I_meet_the_team_fau8 from "../../assets/illustrations/library/meet-the-team_fau8.svg";
import I_mindfulness_d853 from "../../assets/illustrations/library/mindfulness_d853.svg";
import I_my_notifications_fy5v from "../../assets/illustrations/library/my-notifications_fy5v.svg";
import I_new_notification_q6lz from "../../assets/illustrations/library/new-notification_q6lz.svg";
import I_notifications_uvwd from "../../assets/illustrations/library/notifications_uvwd.svg";
import I_online_calendar_iz1q from "../../assets/illustrations/library/online-calendar_iz1q.svg";
import I_online_community_3o0l from "../../assets/illustrations/library/online-community_3o0l.svg";
import I_peekaboo_5o8i from "../../assets/illustrations/library/peekaboo_5o8i.svg";
import I_protection_enabled_pve7 from "../../assets/illustrations/library/protection-enabled_pve7.svg";
import I_push_notifications_5z1s from "../../assets/illustrations/library/push-notifications_5z1s.svg";
import I_quality_time_h2b9 from "../../assets/illustrations/library/quality-time_h2b9.svg";
import I_reminders_o8j5 from "../../assets/illustrations/library/reminders_o8j5.svg";
import I_schedule_ry1w from "../../assets/illustrations/library/schedule_ry1w.svg";
import I_secure_password_9qv4 from "../../assets/illustrations/library/secure-password_9qv4.svg";
import I_security_on_3ykb from "../../assets/illustrations/library/security-on_3ykb.svg";
import I_social_friends_mt6k from "../../assets/illustrations/library/social-friends_mt6k.svg";
import I_sweet_home_b054 from "../../assets/illustrations/library/sweet-home_b054.svg";
import I_team_mmq0 from "../../assets/illustrations/library/team_mmq0.svg";
import I_time_management_4ss6 from "../../assets/illustrations/library/time-management_4ss6.svg";
import I_to_do_list_eoia from "../../assets/illustrations/library/to-do-list_eoia.svg";
import I_two_factor_authentication_ofho from "../../assets/illustrations/library/two-factor-authentication_ofho.svg";
import I_unlock_m0yr from "../../assets/illustrations/library/unlock_m0yr.svg";
import I_walk_stats_g34b from "../../assets/illustrations/library/walk-stats_g34b.svg";
import I_welcome_aboard_y4e9 from "../../assets/illustrations/library/welcome-aboard_y4e9.svg";
import I_working_out_6ksl from "../../assets/illustrations/library/working-out_6ksl.svg";
import I_yoga_i399 from "../../assets/illustrations/library/yoga_i399.svg";

export const ILLUSTRATION_COMPONENTS: Record<string, FunctionComponent<SvgProps>> = {
  "classic-welcome": I_classic_welcome,
  "classic-secure-login": I_classic_secure_login,
  "classic-goal": I_classic_goal,
  "classic-calendar": I_classic_calendar,
  "classic-medicine": I_classic_medicine,
  "classic-doctor": I_classic_doctor,
  "classic-notifications": I_classic_notifications,
  "classic-meditation": I_classic_meditation,
  "classic-well-done": I_classic_well_done,
  "classic-healthy-lifestyle": I_classic_healthy_lifestyle,
  "classic-expecting": I_classic_expecting,
  "action-required_pplo": I_action_required_pplo,
  "alarm-ringing_4deu": I_alarm_ringing_4deu,
  "all-checked_d3u6": I_all_checked_d3u6,
  "authentication_1evl": I_authentication_1evl,
  "biometric-login_v832": I_biometric_login_v832,
  "calendar_8r6s": I_calendar_8r6s,
  "completing_3pe7": I_completing_3pe7,
  "date-picker_8qys": I_date_picker_8qys,
  "digital-calendar_180l": I_digital_calendar_180l,
  "events-calendar_sudy": I_events_calendar_sudy,
  "followers_m4z4": I_followers_m4z4,
  "forgot-password_nttj": I_forgot_password_nttj,
  "friends-online_gvwz": I_friends_online_gvwz,
  "guidelines_p5r7": I_guidelines_p5r7,
  "happy-news_6lg3": I_happy_news_6lg3,
  "hello_ccwj": I_hello_ccwj,
  "hiking_9zta": I_hiking_9zta,
  "lock-screen-notifications_n6o8": I_lock_screen_notifications_n6o8,
  "meditation_k4oa": I_meditation_k4oa,
  "meet-the-team_fau8": I_meet_the_team_fau8,
  "mindfulness_d853": I_mindfulness_d853,
  "my-notifications_fy5v": I_my_notifications_fy5v,
  "new-notification_q6lz": I_new_notification_q6lz,
  "notifications_uvwd": I_notifications_uvwd,
  "online-calendar_iz1q": I_online_calendar_iz1q,
  "online-community_3o0l": I_online_community_3o0l,
  "peekaboo_5o8i": I_peekaboo_5o8i,
  "protection-enabled_pve7": I_protection_enabled_pve7,
  "push-notifications_5z1s": I_push_notifications_5z1s,
  "quality-time_h2b9": I_quality_time_h2b9,
  "reminders_o8j5": I_reminders_o8j5,
  "schedule_ry1w": I_schedule_ry1w,
  "secure-password_9qv4": I_secure_password_9qv4,
  "security-on_3ykb": I_security_on_3ykb,
  "social-friends_mt6k": I_social_friends_mt6k,
  "sweet-home_b054": I_sweet_home_b054,
  "team_mmq0": I_team_mmq0,
  "time-management_4ss6": I_time_management_4ss6,
  "to-do-list_eoia": I_to_do_list_eoia,
  "two-factor-authentication_ofho": I_two_factor_authentication_ofho,
  "unlock_m0yr": I_unlock_m0yr,
  "walk-stats_g34b": I_walk_stats_g34b,
  "welcome-aboard_y4e9": I_welcome_aboard_y4e9,
  "working-out_6ksl": I_working_out_6ksl,
  "yoga_i399": I_yoga_i399,
};
