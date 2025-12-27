// Shared meals data used by both HomeScreen and MealsScreen
import { Meal } from '@/src/types/meals';

export const initialMealsData: Meal[] = [
    {
        id: 'breakfast',
        emoji: '☀️',
        name: 'Breakfast',
        nameAr: 'الافطار',
        time: '8:00 AM',
        completed: true,
        categories: [
            {
                id: 'carbs', emoji: '🍞', name: 'Carbs', nameAr: 'النشويات', expanded: false,
                options: [
                    { id: '1', text: 'نص رغيف خبز اسمر', selected: false },
                    { id: '2', text: 'شريحتين توست اسمر', selected: false },
                    { id: '3', text: '4 بقسماط سن', selected: true },
                    { id: '4', text: '1 بيتي بان اسمر', selected: false }
                ]
            },
            {
                id: 'protein', emoji: '🥚', name: 'Protein', nameAr: 'البروتين', expanded: false,
                options: [
                    { id: '1', text: 'بيضه مسلوقه', selected: true },
                    { id: '2', text: 'بيضه اومليت بدون زيت', selected: false },
                    { id: '3', text: 'شريحه شيدر لايت', selected: false },
                ]
            },
            {
                id: 'dairy', emoji: '🥛', name: 'Dairy', nameAr: 'الألبان', expanded: false,
                options: [
                    { id: '1', text: 'كوب زبادي لايت', selected: true },
                    { id: '2', text: 'كوب لبن خالي الدسم', selected: false }
                ]
            }
        ]
    },
    {
        id: 'snack1',
        emoji: '🍏',
        name: 'Morning Snack',
        nameAr: 'سناكس الصباح',
        time: '11:00 AM',
        completed: false,
        categories: [
            {
                id: 'options', emoji: '', name: 'Choose 1 option', nameAr: 'اختر خيار واحد', expanded: false,
                options: [
                    { id: '1', text: 'ثمرة فاكهة', selected: false },
                    { id: '2', text: 'طبق سلطة صغير', selected: true },
                    { id: '3', text: 'خضار مقطع', selected: false }
                ]
            }
        ]
    },
    {
        id: 'lunch',
        emoji: '🍽️',
        name: 'Lunch',
        nameAr: 'الغداء',
        time: '1:00 PM',
        completed: false,
        categories: [
            {
                id: 'carbs', emoji: '🍞', name: 'Carbs', nameAr: 'النشويات', expanded: false,
                options: [
                    { id: '1', text: '3 معالق مكرونة', selected: false },
                    { id: '2', text: 'أرز مطبوخ بملعقة زيت', selected: false },
                    { id: '3', text: '6 ملاعق مكرونه', selected: false },
                    { id: '4', text: 'نص رغيف بلدي', selected: false },
                ]
            },
            {
                id: 'protein', emoji: '🍗', name: 'Protein', nameAr: 'البروتين', expanded: false,
                options: [
                    { id: '1', text: 'شريحة صدر فراخ مشوي', selected: false },
                    { id: '2', text: 'ربع فرخة مسلوقة', selected: false },
                    { id: '3', text: 'سمك فيليه مشوي', selected: false },
                ]
            },
            {
                id: 'vegetables', emoji: '🥗', name: 'Vegetables', nameAr: 'الخضار', expanded: false,
                options: [
                    { id: '1', text: 'طبق سلطة كبير', selected: false },
                    { id: '2', text: 'خضار سوتيه', selected: false },
                ]
            }
        ]
    },
    {
        id: 'snack2',
        emoji: '🍏',
        name: 'Afternoon Snack',
        nameAr: 'سناكس',
        time: '7:00 PM',
        completed: false,
        categories: [
            {
                id: 'options', emoji: '', name: 'Choose 1 option', nameAr: 'اختر خيار واحد', expanded: false,
                options: [
                    { id: '1', text: 'ثمرة فاكهة', selected: false },
                    { id: '2', text: 'طبق سلطة صغير', selected: true },
                    { id: '3', text: 'خضار مقطع', selected: false }
                ]
            }
        ]
    },
    {
        id: 'dinner',
        emoji: '🌙',
        name: 'Dinner',
        nameAr: 'العشاء',
        time: '10:00 PM',
        completed: false,
        categories: [
            {
                id: 'carbs', emoji: '🍞', name: 'Carbs', nameAr: 'النشويات', expanded: false,
                options: [
                    { id: '1', text: 'نص رغيف خبز اسمر', selected: false },
                    { id: '2', text: 'شريحتين توست اسمر', selected: false },
                    { id: '3', text: '4 بقسماط سن', selected: true },
                    { id: '4', text: '1 بيتي بان اسمر', selected: false }
                ]
            },
            {
                id: 'protein', emoji: '🥚', name: 'Protein', nameAr: 'البروتين', expanded: false,
                options: [
                    { id: '1', text: 'بيضه مسلوقه', selected: true },
                    { id: '2', text: 'بيضه اومليت بدون زيت', selected: false },
                    { id: '3', text: 'شريحه شيدر لايت', selected: false },
                ]
            },
            {
                id: 'dairy', emoji: '🥛', name: 'Dairy', nameAr: 'الألبان', expanded: false,
                options: [
                    { id: '1', text: 'كوب زبادي لايت', selected: true },
                    { id: '2', text: 'كوب لبن خالي الدسم', selected: false }
                ]
            }
        ]
    },
];
