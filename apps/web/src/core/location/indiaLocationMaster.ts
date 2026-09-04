/**
 * Authoritative Production-Ready India Jurisdiction & Location Master
 * Covers all 28 States and 8 Union Territories with official GST State Codes and canonical cities/localities.
 */

export interface StateMasterItem {
  stateName: string;
  stateCode: string; // Official 2-digit Indian GST State Code
  isUT: boolean;
}

export const INDIA_STATES_AND_UTS: StateMasterItem[] = [
  { stateName: 'Andaman and Nicobar Islands', stateCode: '35', isUT: true },
  { stateName: 'Andhra Pradesh', stateCode: '37', isUT: false },
  { stateName: 'Arunachal Pradesh', stateCode: '12', isUT: false },
  { stateName: 'Assam', stateCode: '18', isUT: false },
  { stateName: 'Bihar', stateCode: '10', isUT: false },
  { stateName: 'Chandigarh', stateCode: '04', isUT: true },
  { stateName: 'Chhattisgarh', stateCode: '22', isUT: false },
  { stateName: 'Dadra and Nagar Haveli and Daman and Diu', stateCode: '26', isUT: true },
  { stateName: 'Delhi', stateCode: '07', isUT: true },
  { stateName: 'Goa', stateCode: '30', isUT: false },
  { stateName: 'Gujarat', stateCode: '24', isUT: false },
  { stateName: 'Haryana', stateCode: '06', isUT: false },
  { stateName: 'Himachal Pradesh', stateCode: '02', isUT: false },
  { stateName: 'Jammu and Kashmir', stateCode: '01', isUT: true },
  { stateName: 'Jharkhand', stateCode: '20', isUT: false },
  { stateName: 'Karnataka', stateCode: '29', isUT: false },
  { stateName: 'Kerala', stateCode: '32', isUT: false },
  { stateName: 'Ladakh', stateCode: '38', isUT: true },
  { stateName: 'Lakshadweep', stateCode: '31', isUT: true },
  { stateName: 'Madhya Pradesh', stateCode: '23', isUT: false },
  { stateName: 'Maharashtra', stateCode: '27', isUT: false },
  { stateName: 'Manipur', stateCode: '14', isUT: false },
  { stateName: 'Meghalaya', stateCode: '17', isUT: false },
  { stateName: 'Mizoram', stateCode: '15', isUT: false },
  { stateName: 'Nagaland', stateCode: '13', isUT: false },
  { stateName: 'Odisha', stateCode: '21', isUT: false },
  { stateName: 'Puducherry', stateCode: '34', isUT: true },
  { stateName: 'Punjab', stateCode: '03', isUT: false },
  { stateName: 'Rajasthan', stateCode: '08', isUT: false },
  { stateName: 'Sikkim', stateCode: '11', isUT: false },
  { stateName: 'Tamil Nadu', stateCode: '33', isUT: false },
  { stateName: 'Telangana', stateCode: '36', isUT: false },
  { stateName: 'Tripura', stateCode: '16', isUT: false },
  { stateName: 'Uttar Pradesh', stateCode: '09', isUT: false },
  { stateName: 'Uttarakhand', stateCode: '05', isUT: false },
  { stateName: 'West Bengal', stateCode: '19', isUT: false },
];

export const INDIA_CITIES_BY_STATE: Record<string, string[]> = {
  'Andaman and Nicobar Islands': ['Port Blair', 'Car Nicobar', 'Mayabunder', 'Diglipur'],
  'Andhra Pradesh': [
    'Visakhapatnam',
    'Vijayawada',
    'Guntur',
    'Nellore',
    'Kurnool',
    'Rajahmundry',
    'Tirupati',
    'Kakinada',
    'Anantapur',
    'Eluru',
    'Ongole',
    'Kadapa',
  ],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro'],
  Assam: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur'],
  Bihar: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai'],
  Chandigarh: ['Chandigarh'],
  Chhattisgarh: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Raigarh', 'Jagdalpur'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
  Delhi: [
    'Central Delhi',
    'East Delhi',
    'New Delhi',
    'North Delhi',
    'North East Delhi',
    'North West Delhi',
    'South Delhi',
    'South East Delhi',
    'South West Delhi',
    'West Delhi',
  ],
  Goa: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  Gujarat: [
    'Ahmedabad',
    'Surat',
    'Vadodara',
    'Rajkot',
    'Bhavnagar',
    'Jamnagar',
    'Junagadh',
    'Gandhinagar',
    'Anand',
    'Navsari',
    'Morbi',
    'Bharuch',
  ],
  Haryana: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Mandi', 'Solan', 'Kullu', 'Hamirpur', 'Bilaspur'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'],
  Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Hazaribagh', 'Deoghar', 'Giridih'],
  Karnataka: [
    'Bengaluru',
    'Mysuru',
    'Hubballi-Dharwad',
    'Mangaluru',
    'Belagavi',
    'Kalaburagi',
    'Davangere',
    'Ballari',
    'Shivamogga',
    'Tumakuru',
    'Udupi',
  ],
  Kerala: [
    'Thiruvananthapuram',
    'Kochi',
    'Kozhikode',
    'Thrissur',
    'Kollam',
    'Palakkad',
    'Alappuzha',
    'Kannur',
    'Kottayam',
    'Malappuram',
  ],
  Ladakh: ['Leh', 'Kargil'],
  Lakshadweep: ['Kavaratti', 'Agatti', 'Amini'],
  'Madhya Pradesh': [
    'Indore',
    'Bhopal',
    'Jabalpur',
    'Gwalior',
    'Ujjain',
    'Sagar',
    'Dewas',
    'Satna',
    'Ratlam',
    'Rewa',
  ],
  Maharashtra: [
    'Mumbai',
    'Pune',
    'Nagpur',
    'Thane',
    'Pimpri-Chinchwad',
    'Nashik',
    'Kalyan-Dombivli',
    'Vasai-Virar',
    'Aurangabad (Chhatrapati Sambhajinagar)',
    'Navi Mumbai',
    'Solapur',
    'Mira-Bhayandar',
    'Bhiwandi',
    'Amravati',
    'Nanded',
    'Kolhapur',
  ],
  Manipur: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
  Meghalaya: ['Shillong', 'Tura', 'Jowai'],
  Mizoram: ['Aizawl', 'Lunglei', 'Champhai'],
  Nagaland: ['Kohima', 'Dimapur', 'Mokokchung'],
  Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore'],
  Puducherry: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali (SAS Nagar)', 'Pathankot', 'Hoshiarpur'],
  Rajasthan: [
    'Jaipur',
    'Jodhpur',
    'Kota',
    'Bikaner',
    'Ajmer',
    'Udaipur',
    'Bhilwara',
    'Alwar',
    'Bharatpur',
    'Sikar',
  ],
  Sikkim: ['Gangtok', 'Namchi', 'Geyzing', 'Mangan'],
  'Tamil Nadu': [
    'Chennai',
    'Coimbatore',
    'Madurai',
    'Tiruchirappalli',
    'Salem',
    'Tiruppur',
    'Erode',
    'Vellore',
    'Tirunelveli',
    'Thoothukudi',
    'Thanjavur',
  ],
  Telangana: [
    'Hyderabad',
    'Warangal',
    'Nizamabad',
    'Khammam',
    'Karimnagar',
    'Ramagundam',
    'Mahbubnagar',
    'Nalgonda',
  ],
  Tripura: ['Agartala', 'Udaipur', 'Dharmanagar'],
  'Uttar Pradesh': [
    'Lucknow',
    'Kanpur',
    'Ghaziabad',
    'Agra',
    'Varanasi',
    'Meerut',
    'Prayagraj (Allahabad)',
    'Noida',
    'Greater Noida',
    'Bareilly',
    'Aligarh',
    'Moradabad',
    'Saharanpur',
    'Gorakhpur',
  ],
  Uttarakhand: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh', 'Rudrapur'],
  'West Bengal': [
    'Kolkata',
    'Howrah',
    'Siliguri',
    'Asansol',
    'Durgapur',
    'Bardhaman',
    'Malda',
    'Baharampur',
    'Habra',
    'Kharagpur',
    'Shantipur',
    'Dankuni',
  ],
};

export function getIndianStates(): StateMasterItem[] {
  return INDIA_STATES_AND_UTS;
}

export function getCitiesForState(stateName: string): string[] {
  if (!stateName || !stateName.trim()) return [];
  const normalized = stateName.trim();
  const match = Object.keys(INDIA_CITIES_BY_STATE).find(
    (key) => key.toLowerCase() === normalized.toLowerCase()
  );
  return match ? INDIA_CITIES_BY_STATE[match] : [];
}

export function getStateCode(stateName: string): string {
  if (!stateName || !stateName.trim()) return '19';
  const match = INDIA_STATES_AND_UTS.find(
    (s) => s.stateName.toLowerCase() === stateName.trim().toLowerCase()
  );
  return match ? match.stateCode : '19';
}

export function isValidCityForState(stateName: string, cityName: string): boolean {
  if (!stateName || !cityName) return true;
  const cities = getCitiesForState(stateName);
  if (cities.length === 0) return true; // fallback if state has custom entries
  return cities.some((c) => c.toLowerCase() === cityName.trim().toLowerCase());
}

export function getAllIndianCities(): string[] {
  return Array.from(new Set(Object.values(INDIA_CITIES_BY_STATE).flat())).sort();
}
