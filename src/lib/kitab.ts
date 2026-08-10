export interface Kitab {
	id: string;
	nama: string;
	penulis?: string;
	file?: string;
}

export const KITAB_LIST: Kitab[] = [
	{
		id: "tuhfatul-athfal",
		nama: "Matan Tuhfatul Athfal",
		penulis: "Syaikh Sulaiman al-Jamzuri",
		file: "/kitab/matan-tuhfah.pdf",
	},
	{
		id: "jazariyyah",
		nama: "Matan al-Jazariyyah",
		penulis: "Imam Ibn al-Jazari",
		file: "/kitab/matan-jazary.pdf",
	},
];