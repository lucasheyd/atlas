import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Tentativa de encontrar o arquivo em diferentes locais
    const possiblePaths = [
      path.join(process.cwd(), 'merkle-proofs.json'),
      path.join(process.cwd(), 'public', 'merkle-proofs.json'),
      path.join(process.cwd(), 'frontend', 'public', 'merkle-proofs.json')
    ];
    
    let fileContent;
    let foundPath = '';
    
    // Tenta cada caminho possível
    for (const filePath of possiblePaths) {
      try {
        fileContent = await fs.readFile(filePath, 'utf8');
        console.log(`Successfully read merkle proofs from ${filePath}`);
        foundPath = filePath;
        break;
      } catch (err) {
        console.log(`Failed to read from ${filePath}`);
      }
    }
    
    // Se não encontrarmos em nenhum lugar, usamos os proofs de fallback
    if (!fileContent) {
      console.log('Using fallback hardcoded merkle proofs');
      fileContent = JSON.stringify({
        "0x80fa3a7d0501083a2a3481da788137bf719d9ede_500_501_502_503_504_505_506_507_508_509_510_511_512_513_514_515_516_517_518_519_601_602_603_604_605_0x0c0e7883804a2dc4cd45bb045a9064e7d956ddc86a5243f55ae556b19ccc4745": [
          "0x38ba7c7210ca3f005c2bb536f91aa6d6e5f81c7660e0fab3f6303d3a65a5756f",
          "0x69c4888b9cb985bd7e067c028a8853028918c7484d011902586f5863349ec8e3"
        ],
        "0xa838c04583664c36974417c6490fd8fe830e3482_169_170_171_172_173_174_175_176_177_520_521_522_523_525_526_527_528_529_546_547_548_549_550_564_598_0x246231030e9887c6eedc709c385ec990fec19b9a8e0a6bf0a629a0cb90351755": [
          "0xf6287db87a3fb92c00637a17e7615d16dbc8b80e46c244856165e683e8b31818",
          "0x69c4888b9cb985bd7e067c028a8853028918c7484d011902586f5863349ec8e3"
        ],
        "0xa838c04583664c36974417c6490fd8fe830e3482_578_579_580_581_582_583_584_585_586_587_588_589_590_591_592_594_595_596_597_600_632_633_670_671_673_0x1c199ec387c4b7fd523d7a8aa8b7e8cf73be637a60f657d5c37372c80f19e0d0": [
          "0xd55c2592d501f59df6a261216c68676882f24da5f30e969b0e2c03b55cee3ebd"
        ]
      });
    }
    
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=86400' // Cache por 24 horas
      }
    });
  } catch (error) {
    console.error('Error in merkle-proofs API route:', error);
    return NextResponse.json(
      { error: 'Failed to load merkle proofs' },
      { status: 500 }
    );
  }
}