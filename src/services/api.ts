import { APPS_SCRIPT_URL } from '../config';
import { ItemObat, SheetName } from '../types';

export async function fetchData(sheet: SheetName, bulan: number): Promise<{
  items: ItemObat[];
  penanggungjawabList: string[];
}> {
  try {
    const url = `${APPS_SCRIPT_URL}?action=getData&sheet=${encodeURIComponent(sheet)}&bulan=${bulan}`;
    
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Response text:', text);
      throw new Error('Invalid JSON response from server');
    }
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Gagal terhubung ke server. Pastikan Google Apps Script sudah di-deploy dengan benar dan set "Anyone" access.');
    }
    throw error;
  }
}

export async function submitStokOpname(payload: {
  sheet: SheetName;
  bulan: number;
  ruangan: string;
  entries: { row: number; barangKembali: number | string; bonSarana: number | string; stokOpname: number | string }[];
}): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify({
        action: 'submitStokOpname',
        ...payload
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Response text:', text);
      throw new Error('Invalid JSON response from server');
    }
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('Submit error:', error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Gagal terhubung ke server. Pastikan Google Apps Script sudah di-deploy dengan benar.');
    }
    throw error;
  }
}
