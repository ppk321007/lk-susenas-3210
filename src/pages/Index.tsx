import { useState } from "react";
import { SurveyLayout } from "@/components/SurveyLayout";
import { Page1Identity } from "@/pages/survey/Page1Identity";
import { Page2Food } from "@/pages/survey/Page2Food";
import { Page3NonFood } from "@/pages/survey/Page3NonFood";
import { Page4Recap } from "@/pages/survey/Page4Recap";
import { Page5Income } from "@/pages/survey/Page5Income";
import { Page6 } from "@/pages/survey/Page6";
import { Page7 } from "@/pages/survey/Page7";
import { SurveyData } from "@/types/survey";
import { useToast } from "@/hooks/use-toast";
import { useSurveyImputasi } from "@/hooks/useSurveyImputasi";

const Index = () => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    namaPendata: "",
    pencacah: "",
    pemeriksa: "",
    nks: "",
    kecamatan: "",
    desa: "",
    sls: "",
    noSampel: "",
    alamat: "",
    namaKepalaRumahTangga: "",
    jumlahAnggotaRumahTangga: 1,
    namaAnggotaRumahTangga: [""],
    makananMinuman: {},
    komoditiASebulan: {},
    komoditiBSebulan: {},
    komoditiCSebulan: {},
    komoditiDSebulan: {},
    komoditiESebulan: {},
    komoditiFSebulan: {},
    komoditiSetahun: {},
    pendapatanUpah: [],
    pendapatanUsaha: [],
    produksiSendiri: {
      perkiraanSewaRumah: { nilaiProduksi: 0, biayaProduksi: 0, surplus: 0 },
      hasilPertanian: { nilaiProduksi: 0, biayaProduksi: 0, surplus: 0 }
    },
    pendapatanKepemilikan: {
      sewaLahan: { diterima: 0, dibayar: 0 },
      bagi_hasil: { diterima: 0, dibayar: 0 },
      deviden: { diterima: 0, dibayar: 0 },
      bunga: { diterima: 0, dibayar: 0 }
    },
    transferBerjalan: {
      pemerintah: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaUang: 0, imputasiTransferDiterimaBarang: 0 },
      pemerintahUangPensiun: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaUang: 0 },
      pemerintahBantuan: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaUang: 0, imputasiTransferDiterimaBarang: 0 },
      badanUsaha: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaBarang: 0 },
      rumahTanggaLain: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaBarang: 0 },
      lembagaNirlaba: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaBarang: 0 },
      luarNegeri: { diterimaUang: 0, diterimaBarang: 0, dibayarUang: 0, dibayarBarang: 0, imputasiTransferDiterimaBarang: 0 }
    },
    transferModal: {
      pemerintah: { 
        diterima: { bangunanTinggal: 0, bangunanBukan: 0, alatProduksi: 0, tanamanHewan: 0, kendaraan: 0, lahan: 0 },
        dibayar: { bangunanTinggal: 0, bangunanBukan: 0, alatProduksi: 0, tanamanHewan: 0, kendaraan: 0, lahan: 0 }
      },
      badanUsaha: { 
        diterima: { bangunanTinggal: 0, bangunanBukan: 0, alatProduksi: 0, tanamanHewan: 0, kendaraan: 0, lahan: 0 },
        dibayar: { bangunanTinggal: 0, bangunanBukan: 0, alatProduksi: 0, tanamanHewan: 0, kendaraan: 0, lahan: 0 }
      },
      rumahTangga: { 
        diterima: { bangunanTinggal: 0, bangunanBukan: 0, alatProduksi: 0, tanamanHewan: 0, kendaraan: 0, lahan: 0 },
        dibayar: { bangunanTinggal: 0, bangunanBukan: 0, alatProduksi: 0, tanamanHewan: 0, kendaraan: 0, lahan: 0 }
      },
      lembagaNirlaba: { 
        diterima: { bangunanTinggal: 0, bangunanBukan: 0, alatProduksi: 0, tanamanHewan: 0, kendaraan: 0, lahan: 0 },
        dibayar: { bangunanTinggal: 0, bangunanBukan: 0, alatProduksi: 0, tanamanHewan: 0, kendaraan: 0, lahan: 0 }
      },
      luarNegeri: { 
        diterima: { bangunanTinggal: 0, bangunanBukan: 0, alatProduksi: 0, tanamanHewan: 0, kendaraan: 0, lahan: 0 },
        dibayar: { bangunanTinggal: 0, bangunanBukan: 0, alatProduksi: 0, tanamanHewan: 0, kendaraan: 0, lahan: 0 }
      }
    },
    asetPerubahan: {
      asetTetapUsaha: {
        bangunanBukan: { pembelian: 0, pemberian: 0, pembuatanSendiri: 0, penjualan: 0, pemberianKepada: 0, netto: 0, imputasiPenamabahanPemberian: 0, imputasiPenguranganPemberianKepada: 0 },
        kendaraan: { pembelian: 0, pemberian: 0, pembuatanSendiri: 0, penjualan: 0, pemberianKepada: 0, netto: 0, imputasiPenamabahanPemberian: 0, imputasiPenguranganPemberianKepada: 0 },
        mesinPeralatan: { pembelian: 0, pemberian: 0, pembuatanSendiri: 0, penjualan: 0, pemberianKepada: 0, netto: 0, imputasiPenamabahanPemberian: 0, imputasiPenguranganPemberianKepada: 0 },
        tanamanHewan: { pembelian: 0, pemberian: 0, pembuatanSendiri: 0, penjualan: 0, pemberianKepada: 0, netto: 0, imputasiPenamabahanPemberian: 0, imputasiPenguranganPemberianKepada: 0 },
        lainnya: { pembelian: 0, pemberian: 0, pembuatanSendiri: 0, penjualan: 0, pemberianKepada: 0, netto: 0 }
      },
      bangunanTinggal: { pembelian: 0, pemberian: 0, pembuatanSendiri: 0, penjualan: 0, pemberianKepada: 0, netto: 0, imputasiPenamabahanPemberian: 0, imputasiPenguranganPemberianKepada: 0 },
      biayaPemindahan: { pembelian: 0, pemberian: 0, pembuatanSendiri: 0, penjualan: 0, pemberianKepada: 0, netto: 0 },
      lahanBarang: { pembelian: 0, pemberian: 0, pembuatanSendiri: 0, penjualan: 0, pemberianKepada: 0, netto: 0, imputasiPenamabahanPemberian: 0, imputasiPenguranganPemberianKepada: 0 }
    }
  });

  const updateSurveyData = (updates: Partial<SurveyData>) => {
    setSurveyData(prev => ({ ...prev, ...updates }));
  };

  const { updateWithImputasi } = useSurveyImputasi(surveyData, updateSurveyData);

  // Helper function to check for incomplete detail fields
  const checkIncompleteDetails = (data: any, checkPage2 = false) => {
    const incompleteItems: string[] = [];

    if (checkPage2) {
      // Check Page 2 food items
      Object.entries(data.makananMinuman || {}).forEach(([key, value]: [string, any]) => {
        if (value?.entries?.length > 0) {
          value.entries.forEach((entry: any, index: number) => {
            if (entry.nilai > 0) {
              if (entry.kategori === 'Pembelian' && (!entry.jenisDetail || entry.jenisDetail === "")) {
                incompleteItems.push(`${key} - Entry ${index + 1}: Pilih jenis pembelian`);
              } else if (entry.kategori === 'Produksi Sendiri/Pemberian' && (!entry.jenisDetail || entry.jenisDetail === "")) {
                incompleteItems.push(`${key} - Entry ${index + 1}: Pilih asal produksi`);
              }
            }
          });
        }
      });
    } else {
      // Check Page 3 non-food items
      const nonFoodCategories = [
        'komoditiASebulan', 'komoditiBSebulan', 'komoditiCSebulan', 
        'komoditiDSebulan', 'komoditiESebulan', 'komoditiFSebulan', 'komoditiSetahun'
      ];

      nonFoodCategories.forEach(category => {
        Object.entries(data[category] || {}).forEach(([key, value]: [string, any]) => {
          if (value?.entries?.length > 0) {
            value.entries.forEach((entry: any, index: number) => {
              if (entry.nilai > 0) {
                if (entry.kategori === 'Pembelian' && (!entry.jenisDetail || entry.jenisDetail === "")) {
                  incompleteItems.push(`${key} - Entry ${index + 1}: Pilih jenis pembelian`);
                } else if (entry.kategori === 'Pemberian' && (!entry.jenisDetail || entry.jenisDetail === "")) {
                  incompleteItems.push(`${key} - Entry ${index + 1}: Pilih jenis pemberian`);
                }
              }
            });
          }
        });
      });
    }

    return incompleteItems;
  };

  const handleNext = () => {
    if (currentPage === 1) {
      // Validasi halaman 1
      if (!surveyData.nks || !surveyData.noSampel || !surveyData.namaKepalaRumahTangga) {
        toast({
          title: "Data Belum Lengkap",
          description: "Mohon pilih NKS dan No Sampel sebelum melanjutkan.",
          variant: "destructive"
        });
        return;
      }
      
      const anggotaKosong = surveyData.namaAnggotaRumahTangga.some(nama => !nama.trim());
      if (anggotaKosong) {
        toast({
          title: "Data Belum Lengkap", 
          description: "Mohon isi nama semua anggota rumah tangga.",
          variant: "destructive"
        });
        return;
      }
    }

    if (currentPage === 2) {
      // Validasi halaman 2 - check for incomplete detail fields
      const incompleteItems = checkIncompleteDetails(surveyData, true);
      if (incompleteItems.length > 0) {
        toast({
          title: "Data Belum Lengkap",
          description: "Mohon lengkapi detail jenis pembelian atau asal produksi yang masih kosong sebelum melanjutkan ke halaman 3.",
          variant: "destructive"
        });
        return;
      }
    }

    if (currentPage === 3) {
      // Validasi halaman 3 - check for incomplete detail fields
      const incompleteItems = checkIncompleteDetails(surveyData, false);
      if (incompleteItems.length > 0) {
        toast({
          title: "Data Belum Lengkap",
          description: "Mohon lengkapi detail jenis pembelian atau jenis pemberian yang masih kosong sebelum melanjutkan ke halaman 4.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (currentPage < 7) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handlePageJump = (page: number) => {
    // If trying to go to page 3 or higher, validate page 2 first
    if (page >= 3) {
      const page2IncompleteItems = checkIncompleteDetails(surveyData, true);
      if (page2IncompleteItems.length > 0) {
        toast({
          title: "Data Belum Lengkap",
          description: "Mohon lengkapi detail jenis pembelian atau asal produksi di halaman 2 terlebih dahulu.",
          variant: "destructive"
        });
        return;
      }
    }

    // If trying to go to page 4 or higher, validate page 3 first
    if (page >= 4) {
      const page3IncompleteItems = checkIncompleteDetails(surveyData, false);
      if (page3IncompleteItems.length > 0) {
        toast({
          title: "Data Belum Lengkap", 
          description: "Mohon lengkapi detail jenis pembelian atau jenis pemberian di halaman 3 terlebih dahulu.",
          variant: "destructive"
        });
        return;
      }
    }

    setCurrentPage(page);
  };

  const getPageTitle = () => {
    const titles = {
      1: "Keterangan Identitas",
      2: "Konsumsi dan Pengeluaran Bahan Makanan", 
      3: "Konsumsi dan Pengeluaran Barang Bukan Makanan",
      4: "Rekapitulasi Pengeluaran",
      5: "Pendapatan Rumah Tangga",
      6: "Rekap Penerimaan dan Pengeluaran",
      7: "Ringkasan Survei"
    };
    return titles[currentPage as keyof typeof titles];
  };

  const renderCurrentPage = () => {
    const pageProps = {
      data: surveyData,
      updateData: updateWithImputasi // Use the imputasi-aware update function
    };

    switch (currentPage) {
      case 1:
        return <Page1Identity {...pageProps} />;
      case 2:
        return <Page2Food {...pageProps} />;
      case 3:
        return <Page3NonFood {...pageProps} />;
      case 4:
        return <Page4Recap {...pageProps} />;
      case 5:
        return <Page5Income {...pageProps} />;
      case 6:
        return <Page6 {...pageProps} />;
      case 7:
        return <Page7 {...pageProps} />;
      default:
        return <Page1Identity {...pageProps} />;
    }
  };

  return (
    <SurveyLayout
      currentPage={currentPage}
      totalPages={7}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onPageJump={handlePageJump}
      title={getPageTitle()}
    >
      {renderCurrentPage()}
    </SurveyLayout>
  );
};

export default Index;
