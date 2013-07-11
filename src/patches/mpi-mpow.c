/* mpi-mpow.c  -  MPI functions
 *	Copyright (C) 1998, 1999, 2001, 2002, 2003 Free Software Foundation, Inc.
 *
 * This file is part of Libgcrypt.
 *
 * Libgcrypt is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * Libgcrypt is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA
 */

#include <config.h>
#include <stdio.h>
#include <stdlib.h>

#include "mpi-internal.h"
#include "longlong.h"
#include "g10lib.h"

void
override_gcry_mpi_mulpowm( gcry_mpi_t res, gcry_mpi_t *basearray, gcry_mpi_t *exparray, gcry_mpi_t m);

/****************
 * RES = (BASE[0] ^ EXP[0]) *  (BASE[1] ^ EXP[1]) * ... * mod M
 */
void
_gcry_mpi_mulpowm( gcry_mpi_t res, gcry_mpi_t *basearray, gcry_mpi_t *exparray, gcry_mpi_t m)
{
    override_gcry_mpi_mulpowm(res,basearray,exparray,m);
}
